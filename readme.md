Overview
--------

The purpose of this project is a simple home monitoring solution, measuring tempurature, humidity, and heating zone
activity. This data should be available via web (mobile and desktop formats).

High-level Architecture
-----------------------

There are 3 main pieces to this system:

+ Local agent to sample data from sensing hardware and create data files
+ Local agent to upload data files into persistent storage.
+ Remote web agent to display aggregates of this data.

While the first two local agents could be combined into one process, the goal here is to keep the individual components
as small and independent as possible.

In order to keep the application responsive under load, the data will not be queried in real-time. Instead, one of the
available web servers will elect to become a background scheduler, generating static files for use by the UI. Primarily,
this consists of generating graphs for each sensor type at each target resolution (daily, weekly, monthly, yearly), for
each media format (wide, large, mobile).

Componenet Usage
----------------

+ Graphing: ZedGraph [1] 
+ I/O interfacing: Phidget libraries [2]

References
----------

[1]: http://sourceforge.net/projects/zedgraph/
[2]: http://www.phidgets.com/

