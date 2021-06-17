import sortingview as sv
import labbox_ephys as le
import kachery_p2p as kc

x = []

workspace_uri = kc.get('sortingview-default-workspace')
if not workspace_uri:
    workspace_uri = le.create_workspace(label='sortingview-default').uri
    kc.set('sortingview-default-workspace', workspace_uri)
workspace = le.load_workspace(workspace_uri)
x.append({
    'workspaceUri': workspace_uri,
    'workspaceLabel': 'sortingview-default'
})

sv.set_workspace_list(x)