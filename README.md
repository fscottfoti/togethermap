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

There are currently four collections.

First, one definition.  *TogetherMap uses the term collections to describe layers of spatial data.*  Collections are sets of shapes.  This is overloaded with the term "collection" used by Mongo.

* Collections -   The Collection MongoDB collection stores a single document per collection which configures that layer, and includes information like name, description, user who created the collection, number of places in the collection, and information on how to theme the collection. 
* Places - places are geojson objects which store *all* your spatial data.  That's right, all shapes are in the same collection.  Filter on one the collectionId attribute (which relates to the _id attribute in the Collections collection) to access all the places for a Collection.
* Followed - a set of documents which keeps track of which collections a user if following
* Comments - a set of documents which keep track of a comments on a given place using the placeId attribute (which relates to the _id attribute in the Places collection).
