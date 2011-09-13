==Drag and drop upload block==

Once installed on a course, this block allows you to drag and drop files directly from your desktop onto a course and have them appear as resouces on that course.

This block works with Moodle 1.9 and Moodle 2.x.
This is the Moodle 1.9 version.
It has been tested with Firefox 5, Chromium 14 and Chrome 12 (all running on Ubunutu 11.04). It has no chance of working in IE, so don't bother trying (it may start working with IE10 or later, depending on MS implementing some key features of HTML 5).
It has only been tested with the 'Topic' course format.

Try selecting multiple file on your desktop and dragging them all onto the course at the same time.

==Installation==

1. Unzip the files to a suitable location on your local machine
2. Create a new folder on the server <moodleroot>/blocks/dndupload
3. Upload the files you unzipped to this new folder on your server
4. Login as administrator and click on 'Notifications'
5. Add the block to a course in the usual way
6. Turn editing on (in the usual way) - the block does not show if editing is off
7. Select a few files from your desktop and drag them onto a course section

==Known issues==

* Does not work in all browsers (IE, older FF/Chrome)
* No easy way to delete all the files, if you accidentally upload too many files (you have to delete them one-by-one)
* Moving resources that you have just uploaded around has slight sorting issues with other files you have just uploaded (if it is a problem, refresh the page)
* NOTE: Deleting a resource will NOT delete the files you uploaded (they are all stored in a 'dndupload' subfolder within the course files). You will have to manually delete any files associated with a deleted resource. Note also that uploading the same file multiple times will result in multiple copies of the same file, with '_number' added onto the end (where 'number' is the next available number).

==Thanks==

Thanks to the following websites, that were invaluable in the creation of this block:
http://www.html5rocks.com/
http://www.thecssninja.com/
http://developer.mozilla.org/
(and, as always, http://docs.moodle.org/dev !)

Special thanks to The University of St Andrews, for sharing some code to put some of the final polish on the operation of the block.

==Contact==

Any problems / questions please contact:
davo@davodev.co.uk
http://www.davodev.co.uk
