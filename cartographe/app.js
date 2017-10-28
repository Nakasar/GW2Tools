const regex_html = /<(.|\n)*?>/;

var difficulty_table = new Map();
difficulty_table.set("peaceful", "Promenade");
difficulty_table.set("easy", "Facile");
difficulty_table.set("normal", "Normal");
difficulty_table.set("difficult", "Difficile");
difficulty_table.set("hardcore", "Epique");

var translate_types = new Map();
translate_types.set("tavern", "Taverne");
translate_types.set("trading", "Commerce");
translate_types.set("exploration", "Exploration");
translate_types.set("mercenary", "Mercenariat");
translate_types.set("research", "Recherche");
translate_types.set("nobility", "Noblesse");
//
translate_types.set("battle", "Bataille");
translate_types.set("camp", "Campement");
translate_types.set("communitary", "Communautaire");
translate_types.set("damages", "Dégâts");
translate_types.set("danger", "Zone dangereuse");
//
translate_types.set("other", "Autre");


var x;
var y;
var thisLoc;
var mode;

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
      types += translate_types.get(this.type[i]) + ", ";
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
    this.category = "location";
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
    this.marker = L.marker(unproject([this.coord.x, this.coord.y]), {icon: iconsList.get(this.icon)}).bindPopup('<h3>' + this.name + '</h3><br>' + formatText(this.description.replace(regex_html, "").replace(/\n/g, "<br>")) + '<br><a href="' + this.site + '">site web</a>');
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
    var date = new Date(loc.end_date);
    var formatteddate = ""
    if (date) {
      formatteddate = "<h4>";
      formatteddate = formatteddate + date.toLocaleDateString();
      if (date.getHours() != 0) {
        formatteddate = formatteddate + " - " + date.toLocaleTimeString().substr(0, 5);
      }
      formatteddate = formatteddate + "</h4>";
    }

    this.marker = L.marker(unproject([this.coord.x, this.coord.y]), {icon: iconsList.get(this.icon)}).bindPopup('<h2>' + this.name + '</h2>' + formatteddate + '<br>' + formatText(this.description.replace(regex_html, "").replace(/\n/g, "<br>")) + '<br><a href="' + this.site + '">site web</a>');
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
iconsList.set("generic", eventIcon);
const tavernIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/thumb/4/4f/Belcher%27s_Bluff_%28map_icon%29.png/20px-Belcher%27s_Bluff_%28map_icon%29.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
iconsList.set("tavern", tavernIcon);
const merchantIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/thumb/4/44/Merchant_%28map_icon%29.png/27px-Merchant_%28map_icon%29.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});
iconsList.set("merchant", merchantIcon);
const genericIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/f/fe/Scout_%28map_icon%29.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});
iconsList.set("other", genericIcon);
const festivalIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/thumb/2/27/Activity_%28map_icon%29.png/20px-Activity_%28map_icon%29.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
iconsList.set("festival", festivalIcon);
const guildIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/thumb/c/c6/Guild_Commendation_Trainer_%28map_icon%29.png/20px-Guild_Commendation_Trainer_%28map_icon%29.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});
iconsList.set("guild", guildIcon);
const assemblyIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/thumb/2/2c/Tournament_Master_%28map_icon%29.png/20px-Tournament_Master_%28map_icon%29.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
iconsList.set("communitary", assemblyIcon)
const battleIcon = L.icon({
    iconUrl: 'https://wiki.guildwars2.com/images/6/67/Event_swords_%28map_icon%29.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});
iconsList.set("fight", battleIcon);

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
      $('#actionDelete').show();
      $('#actionModify').show();
    } else if(thisUser.id === loc.owner.id) {
      $('#actionDelete').show();
      $('#actionModify').show();
    } else {
      $('#actionDelete').hide();
      $('#actionModify').hide();
    }
  } else {
    $('#actionDelete').hide();
    $('#actionModify').hide();
  }
  return false;
}

function formatText(text) {
  var formatted = "";

  formatted = text.replace(/\[color=(.+)\](.+)\[\/color\]/g, '<span style="color: $1;">$2</span>');
  formatted = formatted.replace(/\[b\](.+)\[\/b\]/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*\*(.+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\[i\](.+)\[\/i\]/g, '<em>$1</em>');
  formatted = formatted.replace(/\*(.+)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/\[u\](.+)\[\/u\]/g, '<u>$1</u>')
  formatted = formatted.replace(/_(.+)_/g, '<u>$1</u>')
  formatted = formatted.replace(/\\n/g, '<br>')

  return formatted;
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

  // Cut description if too long.
  if (loc.description.length > 800) {
    $('.description').html(formatText(loc.description.replace(regex_html, "")))
  } else {
    $('.description').html(formatText(loc.description.replace(regex_html, "")))
  }

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

  $('#hours-heading').text("Date");
  var date = new Date(loc.end_date);
  if (date) {
      $('.hours').text(date.toLocaleDateString() + " " + date.toLocaleTimeString().substr(0, 5));
  } else {
    $('.hours').text("Non renseigné.");
  }

  $('.type').text(loc.typesToString());

  $('.site').text(loc.site).attr('href', loc.site).removeClass("list-group-item-info").addClass("list-group-item-danger");

  // Cut description if too long.
  $('.description').html(formatText(loc.description.replace(regex_html, "")));

  displayCommand(loc);
  thisLoc = loc;

  $("#sidebar").animate({
    width: "300"
  }, 500, function() {
    //map.invalidateSize();
  });
}

/*
  Set detail modal.
*/
$('#permloc-detail-modal').on('show.bs.modal', function (e) {
  $('#permloc-detail-modal-title').text(thisLoc.name);
  $('#permloc-detail-modal-description').html(formatText(thisLoc.description.replace(regex_html, "")));
})

/*
  Called when the user clicked the "modify" locatio button. It opens the location form modal, fills it with current data, and updates the document when user validates.
*/
function actionModify() {
  mode = "modify";
  sidebarClose();

  if (thisLoc.category === "location") {

    x = thisLoc.coord.x;
    y = thisLoc.coord.y;

    $('#perm-form #name').val(thisLoc.name);
    $('#perm-form #contact').val(thisLoc.contact);
    $('#perm-form #description').val(thisLoc.description.replace(regex_html, ""));
    $('#perm-form #type').val(thisLoc.type);
    $('#perm-form #icon').val(thisLoc.icon);
    $('#perm-form #hours').val(thisLoc.hours);
    $('#perm-form #site').val(thisLoc.site);

    $('#addLocationTabs a[href="#addPermanentLocationTabContent"]').tab('show');
    $("#addMarkerModal").modal("show");

  } else if (thisLoc.category === "event") {

    x = thisLoc.coord.x;
    y = thisLoc.coord.y;

    $('#event-form #name').val(thisLoc.name);
    $('#event-form #contact').val(thisLoc.contact);
    $('#event-form #description').val(thisLoc.description.replace(regex_html, ""));
    $('#event-form #type').val(thisLoc.type);
    $('#event-form #icon').val(thisLoc.icon);

    var date = new Date(thisLoc.end_date);
    if (date) {
      $('#event-form #end_date').val(date.toISOString().substr(0, 10));
      $('#event-form #end_hour').val(date.toLocaleTimeString())
    }

    $('#event-form #site').val(thisLoc.site);
    $('#event-form #difficulty').val(thisLoc.difficulty);

    $('#addLocationTabs a[href="#addEventLocationTabContent"]').tab('show');
    $("#addMarkerModal").modal("show");

  }
}

function actionDelete() {
  if (thisLoc.category === "location") {
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
        if (json.success) {
          map.removeLayer(thisLoc.marker);
          sidebarClose();
        }
      }
    });
  }
}

function onMapClick(e) {
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
    description = $('#perm-form #description').val().replace(regex_html, ""),
    type = $('#perm-form #type').val(),
    coord = "[" + x + "," + y + "]",
    icon = $('#perm-form #icon').val(),
    hours = $('#perm-form #hours').val(),
    site = $('#perm-form #site').val(),
    category = "location";


  if (mode === "add") {
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
          sidebarDisplayPermLoc(location);
        }
      }
    });
  } else if (mode === "modify") {
    // Request API to add permanent location...
    $.ajax({
      method: "PUT",
      url: 'http://gw2rp-tools.ovh/api/locations/' + thisLoc.id,
      data: { name: name, description: description, contact: contact, types: type, coord: coord, icon: icon, category: category, hours: hours, site: site, token: thisUser.token },
      dataType: 'json',
      success: function(json) {
        console.log(json);
        if (json.success) {
          map.removeLayer(thisLoc.marker);

          var location = json.location;
          var permanentLocation = PermanentLocation.parse(location);
          addMarker(permanentLocation);

          $("#addMarkerModal").modal("hide");
          sidebarDisplayPermLoc(permanentLocation);
        }
      }
    });
  }

  return false;
});

$("#event-form-submit").click(function() {

  var name = $('#event-form #name').val(),
    contact = $('#event-form #contact').val(),
    description = $('#event-form #description').val().replace(regex_html, ""),
    type = $('#event-form #type').val(),
    coord = "[" + x + "," + y + "]",
    icon = $('#event-form #icon').val().toLowerCase(),
    end_date = $('#event-form #end_date').val(),
    end_hour = $('#event-form #end_hour').val();
    site = $('#event-form #site').val(),
    category = "location",
    difficulty = $('#event-form #difficulty').val();

  var date = new Date(end_date);
  if (date) {
    if (end_hour.length > 0) {
      date.setHours(end_hour.split(':')[0]);
      date.setMinutes(end_hour.split(':')[1]);
    } else {
      date.setHours(0);
      date.setMinutes(0);
    }
    end_date = date.toString();
  } else {
    return false;
  }

  if (mode === "add") {
    // Request API to add permanent location...
    $.ajax({
      method: "POST",
      url: 'http://gw2rp-tools.ovh/api/events',
      data: { name: name, description: description, contact: contact, types: type, coord: coord, icon: icon, category: category, end_date: end_date, site: site, difficulty: difficulty, token: thisUser.token },
      dataType: 'json',
      success: function(json) {
        if (json.success) {
          var event = json.event;
          var eventLocation = EventLocation.parse(event);
          addMarker(eventLocation);

          $("#addMarkerModal").modal("hide");
          sidebarDisplayEventLoc(eventLocation);
        }
      },
      fail: function(json) {
      }
    });
  } else if (mode === "modify") {
    // Request API to add permanent location...
    $.ajax({
      method: "PUT",
      url: 'http://gw2rp-tools.ovh/api/events/' + thisLoc.id,
      data: { name: name, description: description, contact: contact, types: type, coord: coord, icon: icon, category: category, end_date: end_date, site: site, difficulty: difficulty, token: thisUser.token },
      dataType: 'json',
      success: function(json) {
        if (json.success) {
          map.removeLayer(thisLoc.marker);
          
          var event = json.event;
          var eventLocation = EventLocation.parse(event);
          addMarker(eventLocation);

          $("#addMarkerModal").modal("hide");
          sidebarDisplayEventLoc(eventLocation);
        }
      },
      fail: function(json) {
      }
    });
  }


  return false;
});

function onMapRightClick(e) {
  var point = map.project(e.latlng, map.getMaxZoom());
  x = point.x;
  y = point.y;

  if(signedIn) {
    mode = "add";
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
    var continent_dims = [49152, 49152];
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
