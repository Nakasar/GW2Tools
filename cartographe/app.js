var x;
var y;
var thisLoc;

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#login-btn").click(function() {
  showLoginModal();
  return false;
});

class User {
  constructor(id, name, admin, email, token) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.photo = "";
    this.admin = admin;
    this.signedIn = true;
    this.token = token;
  }

  static noUser() {
    var user = new User(0, "None", "none", "none");
    user.signedIn = false;
    return user;
  }

  toString() {
    return this.name + " - " + this.email + " - " + this.id + " - is admin: " + this.admin;
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static unpackCoord(coord) {
    // coord = '[x, y]'
    var ncoord = coord.slice(1, -1);
    var xy = ncoord.split(',');
    return new Point(xy[0], xy[1]);
  }
}

class Location {
  constructor(id, owner_id, name, coord, contact, type, description, site, icon) {
    this.icon = icon;
    this.owner_id = owner_id;
    this.id = id;
    this.name = name;
    this.coord = coord;
    this.contact = contact;
    this.type = type;
    this.description = description;
    this.site = site;
  }

  get getName() {
    return this.name;
  }

  get pos() {
    return [this.x(), this.y()];
  }

  typesToString() {
    var types = "";
    for(var i = 0; i < this.type.length; i++) {
      types += this.type[i] + ", ";
    }
    return types;
  }

  static unpackType(types) {
    return types.slice(1, -1).split(",");
  }

  // Méthodes liées à la carte
  createMarker() {}
}

class PermanentLocation extends Location {
  constructor(id, owner_id, name, coord, contact, type, description, site, hours, icon) {
    super(id, owner_id, name, coord, contact, type, description, site, icon);
    this.hours = hours;
    this.category = "lieu";
  }

  static parse (json) {
    var j_category = json.category,
      j_contact = json.contact,
      j_coord = json.coord,
      j_created_date = json.created_date,
      j_description = json.description,
      j_hours = json.hours,
      j_icon = json.icon,
      j_name = json.name,
      j_owner_id = json.owner_id,
      j_site = json.site,
      j_type = json.types,
      j_id = json._id;

      return new PermanentLocation(j_id, j_owner_id, j_name, Point.unpackCoord(j_coord), j_contact, j_type, j_description, j_site, j_hours, j_icon);
  }

  createMarker() {
    var loc = this;
    this.marker = L.marker(unproject([this.coord.x, this.coord.y]), {icon: iconsList.get(this.icon)}).bindPopup('<b>' + this.name + '</b><br>' + this.description + '<br><a href="' + this.site + '">site web</a>');
    this.marker.on("click", function(e) {
      sidebarDisplayPermLoc(loc);
    });
    this.marker.addTo(map);
  }
}

class EventLocation extends Location {
  constructor(id, owner_id, name, coord, contact, type, description, site, end_date, icon, difficulty) {
    super(id, owner_id, name, coord, contact, type, description, site, icon);
    this.end_date = end_date;
    this.category = "event";
    this.difficulty = difficulty;
  }

  static parse(json) {
    var j_category = json.category,
      j_contact = json.contact,
      j_coord = json.coord,
      j_created_date = json.created_date,
      j_description = json.description,
      j_end_date = json.end_date,
      j_icon = json.icon,
      j_name = json.name,
      j_owner_id = json.owner_id,
      j_site = json.site,
      j_type = json.types,
      j_id = json._id,
      j_difficulty = json.difficulty;

      return new EventLocation(j_id, j_owner_id, j_name, Point.unpackCoord(j_coord), j_contact, j_type, j_description, j_site, j_end_date, j_icon, j_difficulty);
  }

  createMarker() {
    var loc = this;
    this.marker = L.marker(unproject([this.coord.x, this.coord.y]), {icon: iconsList.get(this.icon)}).bindPopup('<b>' + this.name + '</b><br>' + this.description + '<br><a href="' + this.site + '">site web</a>');
    this.marker.on("click", function(e) {
      sidebarDisplayEventLoc(loc);
    });
    this.marker.addTo(map);
  }
}

var permanentLocations = [];

// Inclusion de la librairie Leaflet
var map;

var iconsList = new Map();
const eventIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/b/bc/Event_star_%28map_icon%29.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});
iconsList.set("générique", eventIcon);
const tavernIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/thumb/4/4f/Belcher%27s_Bluff_%28map_icon%29.png/20px-Belcher%27s_Bluff_%28map_icon%29.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
iconsList.set("taverne", tavernIcon);
const merchantIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/thumb/4/44/Merchant_%28map_icon%29.png/27px-Merchant_%28map_icon%29.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});
iconsList.set("commerce", merchantIcon);
const genericIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/f/fe/Scout_%28map_icon%29.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});
iconsList.set("divers", genericIcon);
const festivalIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/thumb/2/27/Activity_%28map_icon%29.png/20px-Activity_%28map_icon%29.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
iconsList.set("festivité", festivalIcon);
const guildIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/thumb/c/c6/Guild_Commendation_Trainer_%28map_icon%29.png/20px-Guild_Commendation_Trainer_%28map_icon%29.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});
iconsList.set("guilde", guildIcon);
const assemblyIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/thumb/2/2c/Tournament_Master_%28map_icon%29.png/20px-Tournament_Master_%28map_icon%29.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
iconsList.set("communautaire", assemblyIcon)
const battleIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/6/67/Event_swords_%28map_icon%29.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});
iconsList.set("combat", battleIcon);

// Conversion de lattitue/longitude en x/y carrés et vice-versa, override de unproject impl�ment�.
//   GW2 : NO = [0,0], SE = [continent_xmax,continent_ymax];
//   Leaflet: NO = [0,0], SE = [-256, 256]
function unproject(coord) {
  return map.unproject(coord, map.getMaxZoom() );
}

// Close sidebar, with style, please :D
function sidebarClose() {
  $("#sidebar").animate({
    width: "0"
  }, 500, function() {
    //map.invalidateSize();
  });
}

function displayCommand(loc) {
  if(signedIn) {
    if(thisUser.admin == 1) {
      console.log("You can delete this token");
      $('#actionDelete').show();
    } else if(thisUser.id === loc.owner.id) {
      $('#actionDelete').show();
      console.log("You can delete this token");
    } else {
      $('#actionDelete').hide();
    }
  } else {
    $('#actionDelete').hide();
  }
  return false;
}

// Display info about a Permanent Location
function sidebarDisplayPermLoc(loc) {
  $('#features').removeClass("panel-default panel-danger").addClass("panel-info");
  $('#sidebar h3').text(loc.name);
  $('.contact').text(loc.contact);

  $('#hours-heading').text("Horaires");
  $('.hours').text(loc.hours);

  $('.type').text(loc.typesToString());

  $('.site').text(loc.site).attr('href', loc.site).removeClass("list-group-item-danger").addClass("list-group-item-info");
  $('.description').text(loc.description);

  displayCommand(loc);

  thisLoc = loc;

  $("#sidebar").animate({
    width: "300"
  }, 500, function() {
    //map.invalidateSize();
  });
}
// DIsplay Infos abour a Temporary Location
function sidebarDisplayEventLoc(loc) {
  $('#features').removeClass("panel-default panel-info").addClass("panel-danger");
  $('#sidebar h3').text(loc.name);
  $('.contact').text(loc.contact);

  $('#hours-heading').text("Date de Fin");
  $('.hours').text(loc.end_date);

  $('.type').text(loc.typesToString());

  $('.site').text(loc.site).attr('href', loc.site).removeClass("list-group-item-info").addClass("list-group-item-danger");
  $('.description').text(loc.description);

  displayCommand(loc);
  thisLoc = loc;

  $("#sidebar").animate({
    width: "300"
  }, 500, function() {
    //map.invalidateSize();
  });
}

function actionDelete() {
  console.log("You choose to delete : " + thisLoc.id);

  if (thisLoc.category === "lieu") {
    // Request API to remove permanent location...
    $.ajax({
      method: "DELETE",
      url: 'http://gw2rp-tools.ovh/api/locations/' + thisLoc.id + "?token=" + thisUser.token,
      dataType: 'json',
      success: function(json) {
        if (json.success) {
          map.removeLayer(thisLoc.marker);
          sidebarClose();
        }
      }
    });
  } else if (thisLoc.category === "event") {
    // Request API to remove event location...
    $.ajax({
      method: "DELETE",
      url: 'http://gw2rp-tools.ovh/api/events/' + thisLoc.id + "?token=" + thisUser.token,
      dataType: 'json',
      success: function(json) {
        console.log(json);
        if (json.success) {
          map.removeLayer(thisLoc.marker);
          sidebarClose();
        }
      }
    });
  }



}


// Lors d'un click gauche, indiquer dans la console les coordon�es (debug)
function onMapClick(e) {
  console.log("You clicked the map at " + map.project(e.latlng,map.getMaxZoom()));
  sidebarClose();
  return false;
}

function showLoginModal() {
  if(signedIn) {
    $('#disconnect').show();
    $('#contact-form').hide();
  }
  else {
    $('#disconnect').hide();
    $('#contact-form').show();
  }
  $("#loginModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
}

function validate_event_form() {

}

function validate_perm_form() {

}

$("#perm-form-submit").click(function() {
  // validate inputs ! IMPORTANT TODO

  var name = $('#perm-form #name').val(),
    contact = $('#perm-form #contact').val(),
    description = $('#perm-form #description').val(),
    type = $('#perm-form #type').val(),
    coord = "[" + x + "," + y + "]",
    icon = $('#perm-form #icon').val().toLowerCase(),
    hours = $('#perm-form #hours').val(),
    site = $('#perm-form #site').val(),
    category = "location";



  // Request API to add permanent location...
  $.ajax({
    method: "POST",
    url: 'http://gw2rp-tools.ovh/api/locations',
    data: { name: name, description: description, contact: contact, types: type, coord: coord, icon: icon, category: category, hours: hours, site: site, token: thisUser.token },
    dataType: 'json',
    success: function(json) {
      console.log(json);
      if (json.success) {
        var location = json.location;
        var permanentLocation = PermanentLocation.parse(location);
        addMarker(permanentLocation);

        $("#addMarkerModal").modal("hide");
      }
    }
  });

  return false;
});

$("#event-form-submit").click(function() {
  var difficulty_table = new Map();
  difficulty_table.set("Promenade", "peaceful");
  difficulty_table.set("Facile", "easy");
  difficulty_table.set("Normal", "normal");
  difficulty_table.set("Difficile", "difficult");
  difficulty_table.set("Epique", "hardcore");

  var name = $('#event-form #name').val(),
    contact = $('#event-form #contact').val(),
    description = $('#event-form #description').val(),
    type = $('#event-form #type').val(),
    coord = "[" + x + "," + y + "]",
    icon = $('#event-form #icon').val().toLowerCase(),
    end_date = $('#event-form #end_date').val(),
    site = $('#event-form #site').val(),
    category = "location",
    difficulty = difficulty_table.get($('#event-form #difficulty').val());

  // Request API to add permanent location...
  $.ajax({
    method: "POST",
    url: 'http://gw2rp-tools.ovh/api/events',
    data: { name: name, description: description, contact: contact, types: type, coord: coord, icon: icon, category: category, end_date: end_date, site: site, difficulty: difficulty, token: thisUser.token },
    dataType: 'json',
    success: function(json) {
      console.log(json);
      if (json.success) {
        var event = json.event;
        var eventLocation = EventLocation.parse(event);
        addMarker(eventLocation);
        
        $("#addMarkerModal").modal("hide");
      }
    },
    fail: function(json) {
      console.log(json);
    }
  });

  return false;
});

function onMapRightClick(e) {
  var point = map.project(e.latlng, map.getMaxZoom());
  x = point.x;
  y = point.y;

  if(signedIn) {
    $("#addMarkerModal").modal("show");
    $(".navbar-collapse.in").collapse("hide");
  }
  else {
    showLoginModal();
  }
  return false;
}

// Création de la Carte
function createMap() {

    // Adds the leaflet map within the specified element, in this case a div with id="mapdiv"
    // Additionally we set the zoom levels to match the tilelayers, and set the coordinate reference system
    map = L.map("mapdiv", {
        minZoom: 2,
        maxZoom: 7,
        crs: L.CRS.Simple
    });

    // Add map tiles using the [[API:Tile service]]
    L.tileLayer("https://tiles.guildwars2.com/1/1/{z}/{x}/{y}.jpg", {
      attribution: "Données et images &copy; ArenaNet",
      id: 'GW2 RP Cartographe'
    }).addTo(map);

    // Restrict the area which can be panned to
    //  In this case we're using the coordinates for the continent of tyria from "https://api.guildwars2.com/v2/continents/1"
    var continent_dims = [40960, 40960];
    map.setMaxBounds(new L.LatLngBounds(unproject([0,0]), unproject(continent_dims))); // northwest, southeast

    // Set the default viewport position (in this case the midpoint) and zoom (in this case 2)
    map.setView(unproject([(continent_dims[0] / 2),(continent_dims[1] / 2)]), 3);

    // Add a function to return clicked coordinates to the javascript console
    map.on("click", onMapClick);
    map.on('contextmenu', onMapRightClick);

}
function addMarkers(list) {
  for(i = 0; i < list.length; i++) {
    list[i].createMarker();
  }
}
function addMarker(loc) {
  loc.createMarker();
}
createMap();
