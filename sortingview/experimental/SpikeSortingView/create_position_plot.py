from typing import List, Union
import numpy as np
from .Figure import Figure

def create_position_plot(*, timestamps: np.array, positions: np.ndarray, dimension_labels: List[str], sampling_frequency: Union[float, None], label: str):
    if positions.ndim == 1:
        positions = np.reshape(positions, (len(positions), 1))
    assert positions.shape[0] == len(timestamps)
    assert len(dimension_labels) == positions.shape[1]
    if sampling_frequency is not None:
        inds = _get_subsample_inds(timestamps, sampling_frequency)
        timestamps = timestamps[inds]
        positions = positions[inds, :]
    data = {
        'type': 'PositionPlot',
        'timestamps': timestamps,
        'positions': positions,
        'dimensionLabels': dimension_labels
    }
    return Figure(
        data=data,
        label=label
    )

def _get_subsample_inds(timestamps: np.array, sampling_frequency: float):
    dt = 1 / sampling_frequency
    ret = []
    last_t = timestamps[0] - dt * 2
    for i in range(len(timestamps)):
        delta = timestamps[i] - last_t
        if delta >= dt * 0.95:
            ret.append(i)
            last_t = timestamps[i]
    return ret
