const text: string = "[//]: # \"This file was automatically generated by jinjaroot. Do not edit directly.\"\nTo add a workspace, run the following Python script on the computer where the backend service is running:\n\n```python\nimport sortingview\nimport labbox_ephys as le\n\n# replace \"new-workspace\" with the name of the new workspace\nnew_workspace_name = 'new-workspace'\n\nworkspace_list = sortingview.WorkspaceList(list_name='default')\nnew_workspace = le.create_workspace()\nworkspace_list.add_workspace(name=new_workspace_name, workspace=new_workspace)\n```"

export default text