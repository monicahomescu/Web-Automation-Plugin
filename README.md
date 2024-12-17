# Web-Automation-Plugin

Once a monday.com web page is loaded and the user navigates to the target board,
the plugin can be accessed by clicking the toolbar icon.

<img src="/demos/demo1.png">

The plugin automatically detects the board name and the current columns, informing the user through the associated textboxes. The operations available for automation can be categorized into three main types: board operations, group operations and row operations. Upon clicking an operation button, an appropriate template is generated and appended to the automation script textbox.

<img width="70%" height="70%" src="/demos/demo5.png">

To rename a board, the user receives the current name of the board and is required to specify a new name. For delete and export board operations, the templates are pre-filled with the current board name, requiring no additional modifications.

Group operations allow users to manage groups within the board. When adding a new group, users can input the name, or the default name ”New Group” will be used. For renaming, deleting, and exporting groups, a dropdown appears on mouse hover, displaying the current groups in the board. Clicking a group name adds the associated template, where renaming requires entering the new group name. Delete and export operations need no further changes once the desired group is selected.

Row operations manage tasks within a specific group, which is chosen by the user through the select group textbox. To insert a new row, users must fill in the desired values in the template, ensuring that the main column is not empty (since monday.com does not allow the user to leave the main column empty). For updating and deleting rows, a dropdown appears on mouse hover, allowing the user to choose the row to perform the operation on. Additionally, a search bar is available, giving the user the choice to find a row based on any key letters present in the main column. For updates, the current values of the row are pre-filled, and users can modify them as needed. For deletions, no further modifications are necessary. Each time a group is selected, the dropdown resets with row options for the newly selected group.

<img align="left" width="15%" height="15%" src="/demos/demo3.png">
<img width="15%" height="15%" src="/demos/demo4.png">

Users can choose to automate as many operations as needed, and the order of these operations does not matter. Once the automation script is complete, it can be executed by clicking the ”Execute” button. The textbox content is preserved across automation sessions, enabling users to close the plugin and return later to continue configuring the automation script. To remove all operations from the textbox, users can click the ”Clear” button.

<img width="70%" height="70%" src="/demos/demo2.png">
