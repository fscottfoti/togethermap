import urllib2
from bs4 import BeautifulSoup
import tmlib as tm
import sys

args = sys.argv[1:]
if len(args) != 2:
    print "Pass in username and password on command line"
    sys.exit()

user, password = args[0], args[1]

# this file is an example of parsing a web page, getting the
# lat/lng of items of the page and adding them to togethermap
# using the tmlib.py module

HN_url = "http://pdx.eater.com/maps/"\
    "the-essential-38-portland-restaurants-july-2014"


def get_page():
    page_html = urllib2.urlopen(HN_url)
    return page_html


def get_places(content):

    # this is uses the Beautiful soup library to parse places
    # out of the webpage - this is just a fun way to get places
    # and not the most relevant to togethermap

    soup = BeautifulSoup(content, 'html.parser')

    places = []
    for div in soup.findAll("div", {"class": "m-map__item m-map__item-card"}):

        url = div.find('a')['href']
        image_url = div.find('div', {'class': 'm-map__item-image'}).\
            find('img')['data-original']
        address = div.find("", {'class': 'm-map__item-contact-segment'}).text

        properties = {
            'description': str(div.p),
            'link_url': url,
            'image_url': image_url,
            'address': address
        }

        btn = div.find('a', {'class': 'm-chorus-directions-button'})

        place = tm.createMarker(
            float(btn['data-lat']),
            float(btn['data-lng']),
            tm.randomColor(),
            div['data-name'],
            description='',
            properties=properties
        )
        places.append(place)

    return places

print "Connecting"
tm.connect(user, password, debug=False,
           server='ws://127.0.0.1:3000/websocket')

print "Creating colection"
error, cid = tm.call('createCollection',
                     [{'name': 'Eater Portland Restaurants'}])
print "Created collection:", cid

print "Loading places"
for place in get_places(get_page()):
    error, pid = tm.call('insertPlace', [place, cid])
    print "Loaded place:", pid
