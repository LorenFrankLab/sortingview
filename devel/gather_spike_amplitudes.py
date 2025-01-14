import numpy as np
import kachery_client as kc
import sortingview as sv
import hither2 as hi
import seriesview as sev
from sortingview.serialize_wrapper import _deserialize

def main():
    x = {
        "recording_object": {
            "data": {
                "h5_uri": "sha1://159bf8a5a067fe2e6fa0ddd35875c48b4b677da8/despereaux20191125_.nwb_02_r1_13_franklab_default_hippocampus_recording.h5v1?manifest=15bda63463ee3f7eb29008b989f09f4b282b427d"
            },
            "recording_format": "h5_v1"
        },
        "sorting_object": {
            "data": {
                "h5_path": "sha1://e7854e34da661693ee758df4cb9401ef90488a50/despereaux20191125_.nwb_02_r1_13_franklab_default_hippocampus_sorting.h5v1"
            },
            "sorting_format": "h5_v1"
        }
    }
    R = sv.LabboxEphysRecordingExtractor(x['recording_object'])
    S = sv.LabboxEphysSortingExtractor(x['sorting_object'])
    from sortingview.helpers import prepare_snippets_h5
    from sortingview.backend.extensions.spikeamplitudes import task_fetch_spike_amplitudes
    MPV = sev.MultiPanelView()
    for unit_id in [18, 19]:
    # for unit_id in [13]:
        job = task_fetch_spike_amplitudes(
            recording_object=R.object(),
            sorting_object=S.object(),
            snippet_len=(20, 20),
            unit_id=unit_id
        )
        x = _deserialize(job.wait().return_value)
        timepoints = x['timepoints']
        amplitudes = x['amplitudes']
        ts = sev.SVSeries.from_numpy(
            type='discrete',
            sampling_frequency=None,
            start_time=0,
            end_time=R.get_num_frames() / R.get_sampling_frequency(),
            segment_duration=10 * 60,
            timestamps=timepoints / R.get_sampling_frequency(),
            values=amplitudes
        )
        MPV.add_event_amplitudes_panel(ts, label=f'Unit {unit_id}')
    F = MPV.figurl()
    url = F.url(label='test seriesview', channel='flatiron1')
    print(url)

if __name__ == '__main__':
    main()