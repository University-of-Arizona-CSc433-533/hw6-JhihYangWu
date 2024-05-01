Code for HW6
------------

Author: {JhihYang Wu} [{jhihyangwu@arizona.edu}]  
Course: CS433 
Date: May. [1], 2024

Executing program:
simply open index.html using a modern browser and then click on choose files 
navigate to the images directory and select/upload a hdr image.
the tone mapped image should render shortly
you can play with the sliders to make the output look better and more realistic

Description:
This simple program applies tone mapping in a few ways to display HDR images
on classical monitors while retaining as much detail and realism as possible
Play with the parameters and press "Save current framebuffer to PPM!" to save
the output

Included files:
* images -- directory holding input HDR images
* output -- saved output images after tone mapping
* written -- directory for written questions
* index.html -- a html file with a canvas
* hdr_parser.js -- a javascript library for parsing hdr files
* FileSaver.js -- a javascript library to save Blob for PPM files
* index.js -- main code of assignment

**PLEASE PROVIDE ANY ATTRIBUTION HERE**
* hdr_parser.js -- https://github.com/vorg/parse-hdr
* FileSaver.js -- https://github.com/eligrey/FileSaver.js
* hdr images from http://people.csail.mit.edu/fredo/PUBLI/Siggraph2002/ and http://www.anyhere.com/gward/hdrenc/pages/originals.html
