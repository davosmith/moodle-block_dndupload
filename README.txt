==Drag and drop upload block==

Once installed on a course, this block allows you to drag and drop files directly from your desktop onto a course and have them appear as resouces on that course.

This block only works in Moodle 2.0 and above.
It has been tested with Firefox 5, Chromium 14 and Chrome 12 (all running on Ubunutu 11.04). It has no chance of working in IE, so don't bother trying (it may start working with IE10 or later, depending on MS implementing some key features of HTML 5).
It has only been tested with the 'Topic' course format.

==Installation==

Make sure you are not trying to install this on a live production server - it is a proof of concept ONLY.

1. Unzip the files to a suitable location on your local machine
2. Create a new folder on the server <moodleroot>/blocks/dndupload
3. Upload the files you unzipped to this new folder on your server
4. Login as administrator and click on 'Notifications'
5. Add the block to a course in the usual way
6. Turn editing on (in the usual way) - the block does not show if editing is off
7. Select a few files from your desktop and drag them onto a course section

==Known issues==

* Does not work in all browsers (IE)
* Need to refresh the page before you can edit the uploaded items (fixable, but a bit of work, so I've concentrated on proving the concept, for the moment)
* No easy way to delete all the files, if you accidentally upload too many files

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
