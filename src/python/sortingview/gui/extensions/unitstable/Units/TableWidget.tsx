import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Checkbox, Grid, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import '../unitstable.css';

export interface Row {
    rowId: string
    data: {[key: string]: {
        value: any,
        sortValue: any
    }}
}

export interface Column {
    columnName: string
    label: string
    tooltip: string
    sort: (a: any, b: any) => number
    dataElement: (d: any) => JSX.Element
    calculating?: boolean
}

type Modifier = null | 'shift' | 'ctrl'

const HeaderRow: FunctionComponent<{
    columns: Column[],
    onColumnClick: (column: Column) => void
    primarySortColumnName: string | undefined
    primarySortColumnDirection: 'ascending' | 'descending' | undefined
    onDeselectAll?: (() => void),
    onSelectAll?: (() => void),
    selectionDisabled?: boolean
}> = (props) => {
    const { columns, onColumnClick, primarySortColumnDirection, primarySortColumnName, onDeselectAll, onSelectAll, selectionDisabled } = props
    return (
        <TableHead>
            <TableRow>
                {
                    onDeselectAll ? (
                        <TableCell key="_checkbox">
                            <RowCheckbox
                                rowId={''}
                                selected={false}
                                onClick={onDeselectAll}
                                isDeselectAll={true}
                                isDisabled={selectionDisabled}
                            />
                        </TableCell>
                    ) : onSelectAll ? (
                        <TableCell key="_checkbox">
                            <RowCheckbox
                                rowId={''}
                                selected={false}
                                onClick={onSelectAll}
                                isDeselectAll={false}
                                isDisabled={selectionDisabled}
                            />
                        </TableCell>
                    ) : (
                        <TableCell key="_checkbox" />
                    )
                }
                {
                    columns.map(column => {
                        const tooltip = (column.tooltip || column.label || '') + ' (click to sort)'
                        return (
                            <TableCell key={column.columnName} onClick={() => onColumnClick(column)} title={tooltip} style={{cursor: 'pointer'}}>
                                <Grid container justify="flex-start" style={{flexFlow: 'row'}}>
                                    <Grid item key="icon">
                                        <span style={{fontSize: 16, color: 'gray', paddingLeft: 3, paddingRight: 5, paddingTop: 2}}>
                                            {
                                                (primarySortColumnName === column.columnName) && (
                                                    primarySortColumnDirection === 'ascending' ? (
                                                        // <TriangleUp fontSize="inherit" />
                                                        <FontAwesomeIcon icon={faCaretUp} />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faCaretDown} />
                                                    )
                                                )
                                            }
                                        </span>
                                    </Grid>
                                    <Grid item key="text">
                                        <span>
                                            <span key="label">{column.label}</span>
                                            <span key="progress">{column.calculating && <LinearProgress />}</span>
                                        </span>
                                    </Grid>
                                </Grid>
                            </TableCell>
                        )
                    })
                }
            </TableRow>
        </TableHead>
    )
}

const RowCheckbox = React.memo((props: {rowId: string, selected: boolean, onClick: (m: Modifier) => void, isDeselectAll?: boolean, isDisabled?: boolean}) => {
    const { rowId, selected, onClick, isDeselectAll, isDisabled } = props
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = useCallback((evt) => {
        // const modifier = evt.ctrlKey ? 'ctrl' : evt.shiftKey ? 'shift' : null
        const modifier = evt.shiftKey ? 'shift' : null
        onClick(modifier)
    }, [onClick])
    return (
        <Checkbox
            checked={selected}
            indeterminate={isDeselectAll ? true : false}
            onClick={handleClick}
            style={{
                padding: 1
            }}
            title={isDeselectAll ? "Deselect all" : `Select ${rowId}`}
            disabled={isDisabled}
        />
    );
});

interface Props {
    selectedRowIds: string[]
    onSelectedRowIdsChanged: (x: string[]) => void
    rows: Row[]
    columns: Column[]
    defaultSortColumnName?: string
    height?: number
    selectionDisabled?: boolean
}

type sortFieldEntry = {columnName: string, keyOrder: number, sortAscending: boolean}
const interpretSortFields = (fields: string[]): sortFieldEntry[] => {
    const result: sortFieldEntry[] = []
    for (let i = 0; i < fields.length; i ++) {
        // We are ascending unless two fields in a row are the same
        const sortAscending = (fields[i - 1] !== fields[i])
        result.push({columnName: fields[i], keyOrder: i, sortAscending})
    }
    return result
}

const TableWidget: FunctionComponent<Props> = (props) => {

    const { selectedRowIds, onSelectedRowIdsChanged, rows, columns, defaultSortColumnName, height, selectionDisabled } = props

    const [sortFieldOrder, setSortFieldOrder] = useState<string[]>([])

    useEffect(() => {
        if ((sortFieldOrder.length === 0) && (defaultSortColumnName)) {
            setSortFieldOrder([defaultSortColumnName])
        }
    }, [setSortFieldOrder, sortFieldOrder, defaultSortColumnName])

    // const toggleAllSelectedRowIds = useCallback(
    //     (rowCount: number) => {
    //         const invertedResult = [...Array(rowCount + 1).keys()]
    //                             .filter(r => !selectedRowIds.includes(r.toString()))
    //                             .map((rowId) => rowId.toString())
    //         onSelectedRowIdsChanged(invertedResult)
    //     },
    //     [selectedRowIds, onSelectedRowIdsChanged]
    // )

    const toggleSelectedRegion = useCallback(
        (sortedRows: Row[], clickedRowId: string) => {
            // We don't know the IDs of each row, only that they're in
            // sorted order.
            // We want to toggle the selection status of the row that was
            // clicked, as well as the contiguous block with the same status
            // on either side.
            // To do this without repeatedly iterating through the list of
            // rows, we'll maintain the current 'run' of units, restarting it
            // every time the selection status ('polarity') changes, until we've
            // found the row with the clicked ID. At that point, we'll flip the
            // selection status of the current run when it ends.

            // Make a Set: closer-to-constant-time lookups of selection status
            const selections: Set<string> = new Set(selectedRowIds)
            let run: string[] = []
            let runPolarity: boolean = selections.has(sortedRows[0].rowId)
            let pastClickedRow: boolean = false
            for (const r of sortedRows) {
                if (selections.has(r.rowId) !== runPolarity) {
                    // We don't care what else is in the list if we've
                    // reached the end of the run that includes the
                    // clicked row.
                    if (pastClickedRow) break

                    // if we aren't past the clicked row when the run ended,
                    // then the current run didn't contain the clicked row, so
                    // it wasn't the right run. Flip polarity & start a new one.
                    runPolarity = !runPolarity
                    run = []
                }
                run.push(r.rowId)
                pastClickedRow = pastClickedRow || r.rowId === clickedRowId
            }
            // Done finding the run; now we need to update the selection.
            // - If runPolarity is true, the run has selected items to deselect.
            // - Otherwise they're to be added to the selection set.
            onSelectedRowIdsChanged(runPolarity
                ? selectedRowIds.filter(x => !run.includes(x))
                : [...selectedRowIds, ...run])
        },
        [selectedRowIds, onSelectedRowIdsChanged]
    )

    const toggleSelectedRowId = useCallback(
        (rowId: string) => {
            const newSelectedRowIds = selectedRowIds.includes(rowId) ? selectedRowIds.filter(x => (x !== rowId)) : [...selectedRowIds, rowId]
            onSelectedRowIdsChanged(newSelectedRowIds)
        },
        [selectedRowIds, onSelectedRowIdsChanged]
    )

    const handleRowClick = useCallback(
        (sortedRows: Row[], rowId: string, modifier: Modifier) => {
            if(!modifier) toggleSelectedRowId(rowId)
            if (modifier === 'shift') {
                toggleSelectedRegion(sortedRows, rowId)
            }
            // if (modifier === 'ctrl') {
            //     toggleAllSelectedRowIds(sortedRows.length)
            // }
        }, [toggleSelectedRowId, toggleSelectedRegion]//, toggleAllSelectedRowIds]
    )

    const sortedRows = [...rows]

    const columnForName = (columnName: string): Column => (columns.filter(c => (c.columnName === columnName))[0])

    const sortingRules = interpretSortFields(sortFieldOrder)
    for (const r of sortingRules) {
        const columnName = r.columnName
        const column = columnForName(columnName)
        sortedRows.sort((a, b) => {
            const dA = (a.data[columnName] || {})
            const dB = (b.data[columnName] || {})
            const valueA = dA.sortValue
            const valueB = dB.sortValue

            return r.sortAscending ? column.sort(valueA, valueB) : column.sort(valueB, valueA)
        })
    }
    const selectedRowIdsLookup: {[key: string]: boolean} = (selectedRowIds || []).reduce((m, id) => {m[id] = true; return m}, {} as {[key: string]: boolean})

    const primaryRule = (sortingRules.length > 0) ? sortingRules[sortingRules.length - 1] : undefined
    const primarySortColumnName = primaryRule ? primaryRule.columnName : undefined
    const primarySortColumnDirection = primaryRule ? (primaryRule.sortAscending ? 'ascending' : 'descending') : undefined
    
    const handleSelectAll = useCallback(() => {
        onSelectedRowIdsChanged(rows.map(row => (row.rowId)))
    }, [onSelectedRowIdsChanged, rows])

    const handleDeselectAll = useCallback(() => {
        onSelectedRowIdsChanged([])
    }, [onSelectedRowIdsChanged])

    return (
        <TableContainer style={height !== undefined ? {maxHeight: height} : {}}>
            <Table stickyHeader className="TableWidget">
                <HeaderRow
                    columns={columns}
                    primarySortColumnName={primarySortColumnName}
                    primarySortColumnDirection={primarySortColumnDirection}
                    onColumnClick={(column) => {
                        const columnName = column.columnName
                        let newSortFieldOrder = [...sortFieldOrder]
                        if (sortFieldOrder[sortFieldOrder.length - 1] === columnName) {
                            if (sortFieldOrder[sortFieldOrder.length - 2] === columnName) {
                                // the last two match this column, let's just remove the last one
                                newSortFieldOrder = newSortFieldOrder.slice(0, newSortFieldOrder.length - 1)
                            }
                            else {
                                // the last one matches this column, let's add another one
                                newSortFieldOrder = [...newSortFieldOrder, columnName]
                            }
                        }
                        else {
                            // the last one does not match this column, let's clear out all previous instances and add one
                            newSortFieldOrder = [...newSortFieldOrder.filter(m => (m !== columnName)), columnName]
                        }
                        setSortFieldOrder(newSortFieldOrder)
                    }}
                    onDeselectAll={selectedRowIds.length === sortedRows.length ? handleDeselectAll : undefined}
                    onSelectAll={selectedRowIds.length < sortedRows.length ? handleSelectAll : undefined}
                    selectionDisabled={selectionDisabled}
                />
                <TableBody>
                    {
                        sortedRows.map((row) => {
                            const selected = selectedRowIdsLookup[row.rowId] || false
                            return (
                                <TableRow key={row.rowId}>
                                    <TableCell key="_checkbox" className={selected ? "selectedRow" : ""}>
                                        <RowCheckbox
                                            rowId={row.rowId}
                                            selected={selected}
                                            // onClick = {() => toggleSelectedRowId(row.rowId)}
                                            onClick = {(m: Modifier) => handleRowClick(sortedRows, row.rowId, m)}
                                            isDisabled={selectionDisabled}
                                        />
                                    </TableCell>
                                    {
                                        columns.map(column => (
                                            <TableCell key={column.columnName} className={selected ? "selectedRow" : ""}>
                                                <div title={column.tooltip}>
                                                    {column.dataElement(row.data[column.columnName].value)}
                                                </div>
                                            </TableCell>
                                        ))
                                    }
                                </TableRow>       
                            )
                        })
                    }
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default TableWidget