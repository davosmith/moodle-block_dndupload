==Drag and drop upload block==

Once installed on a course, this block allows you to drag and drop files directly from your desktop onto a course and have them appear as resouces on that course.

This is an EXPERIMENTAL PROOF OF CONCEPT block that should NOT be installed on a production system.
It is not guarenteed to be secure (in fact, I can almost promise that it is unsecure).
I cannot promise it will work on your site and it will certainly not work with all browsers.

This block only works in Moodle 2.0 and above.
It has been tested with Firefox 5, Chromium 14 and Chrome 12 (all running on Ubunutu 11.04). It has no chance of working in IE, so don't bother trying (it may star working with IE10 or later, depending on MS implementing some key features of HTML 5).
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

* Does not work in all browsers
* Need to refresh the page before you can edit the uploaded items (fixable, but a bit of work, so I've concentrated on proving the concept, for the moment)
* Larger files (within the course limit) can sometimes fail to upload
* Files are probably not checked properly on the server (security risk)
* No easy way to delete all the files, if you accidentally upload too many files

==Contact==

Any problems / questions please contact:
davo@davodev.co.uk
http://www.davodev.co.uk
