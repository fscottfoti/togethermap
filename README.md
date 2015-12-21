TogetherMap
===========

## A web and mobile app for collaborative mapping

TogetherMap is intended to be to shapefiles what the Google Productivity Suite is to email/calendar/docs.

It utilizes Meteor/Mongo on the backend and the Mapbox stack on the font - think web maps backed by a trivial-to-install database and you have the right idea.

Let's get this one out of the way right from the start: why not back with a Postgres/Postgis db?  Honestly, for two reasons.  1) Postgres is a bear to install and 2) maintaining schemas across application contexts is an enormous pain.  In my opinion, it's about time for geo to move to the web paradigm = json documents and filters on collections rather than relationships, and do geo analysis in Python.  The day might not be today, but it's coming.  Of course, many important projects are built on Postgis today, so including Postgis connectivity as an option makes a ton of sense.  Let's look at how those two things work in TM and you'll begin to see the advantages.

## Installation

Installation is so simple. 

* First [Install Meteor](https://www.meteor.com/install)
* Second clone this repo
* Third run `meteor` in the cloned repo
* Fourth open up `http://localhost:3000/` in a web browser

## Meteor/Mongo Data Schema

There are currently four Meteor/Mongo collections.

* Layers - The Layers collection stores a single document per layer which configures that layer, and includes information like name, description, the user who created the layer, number of places in the layer, and information on how to theme the layer.
* Places - places are geojson objects which store your spatial data.  That's right, all shapes are in the same collection.  Filter on the layerId attribute (which relates to the _id attribute in the Layer collection) to access all the places for a layer.
* Followed - a set of documents which keeps track of which layers a user if following.  This could probably by user data (i.e. in the Meteor Users collection), but it's not right now.
* Comments - a set of documents which keep track of the comments on a given place using the placeId attribute (which relates to the _id attribute in the Places collection).
