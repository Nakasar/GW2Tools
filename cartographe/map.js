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

const eventTypes = ["battle", "camp", "communitary", "damages", "danger", "other"];
const locationTypes = ["tavern", "trading", "exploration", "mercenary", "research", "nobility", "other"];

// Inclusion de la librairie Leaflet
var map;

var iconsList = new Map();
const rumourIcon = L.icon({
  iconUrl: '/src/img/icons/20px-map-rumor.png',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});
iconsList.set("rumour", rumourIcon);
const eventIcon = L.icon({
    iconUrl: '/src/img/icons/20px-map-generic.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});
iconsList.set("generic", eventIcon);
const tavernIcon = L.icon({
    iconUrl: '/src/img/icons/20px-map-tavern.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -15]
});
iconsList.set("tavern", tavernIcon);
const merchantIcon = L.icon({
    iconUrl: '/src/img/icons/20px-map-merchant.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -20]
});
iconsList.set("merchant", merchantIcon);
const genericIcon = L.icon({
    iconUrl: '/src/img/icons/20px-map-generic-guild.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});
iconsList.set("other", genericIcon);
const festivalIcon = L.icon({
    iconUrl: '/src/img/icons/20px-map-explorers.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -15]
});
iconsList.set("festival", festivalIcon);
const guildIcon = L.icon({
    iconUrl: '/src/img/icons/20px-map-guild.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});
iconsList.set("guild", guildIcon);
const assemblyIcon = L.icon({
    iconUrl: '/src/img/icons/20px-map-community.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -15]
});
iconsList.set("communitary", assemblyIcon)
const battleIcon = L.icon({
    iconUrl: '/src/img/icons/20px-map-battle.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});
iconsList.set("fight", battleIcon);

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

class Rumour {
  constructor(id, owner_id, title, coord, contact, text, site) {
    this.id = id;
    this.owner_id = owner_id;
    this.title = title;
    this.coord = coord;
    this.contact = contact;
    this.text = text;
    this.site = site;
    this.category = "rumour";
    this.type = "rumour";
  }

  static parse (json) {
    var j_id = json._id,
      j_owner_id = json.owner,
      j_title = json.name,
      j_coord = json.coord,
      j_contact = json.contact,
      j_text = json.text,
      j_site = json.site;

    return new Rumour(j_id, j_owner_id, j_title, Point.unpackCoord(j_coord), j_contact, j_text, j_site);
  }

  createMarker() {
    var loc = this;
    var popupContent = '<h3>' + this.title + '</h3><br>';
    if (thisUser && (thisUser.admin || thisUser.id == this.owner_id)) {
      popupContent += '<a href="#" onClick="actionDelete()">Supprimer</a> - <a href="#" onClick="actionModify()">Modifier</a><br>';
    }
    popupContent += formatText(this.text.replace(regex_html, "")).replace(/\n/g, "<br>");
    if (this.site.length > 0) {
      popupContent += '<br><a target="_blank" href="' + this.site + '">site web</a>';
    }

    this.marker = L.marker(unproject([this.coord.x, this.coord.y]), {icon: rumourIcon})
      .bindPopup(popupContent);
    this.marker.on("click", function(e) {
      var stateObj = { foo: "bar" };
      history.pushState(stateObj, loc.title, "?id=" + loc.id);
      sideBarDisplayLocation(loc);
    });
    this.marker.addTo(map);
    this.hidden = false;
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
    this.hidden = false;
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
      j_owner_id = json.owner,
      j_site = json.site,
      j_type = json.types,
      j_id = json._id;

      return new PermanentLocation(j_id, j_owner_id, j_name, Point.unpackCoord(j_coord), j_contact, j_type, j_description, j_site, j_hours, j_icon);
  }

  createMarker() {
    var loc = this;

    var popupContent = '<h3>' + this.name + '</h3><br>';
    if (thisUser && (thisUser.admin || thisUser.id == this.owner_id)) {
      popupContent += '<a href="#" onClick="actionDelete()">Supprimer</a> - <a href="#" onClick="actionModify()">Modifier</a><br>';
    }
    popupContent += formatText(this.description.replace(regex_html, "")).replace(/\n/g, "<br>");
    if (this.site.length > 0) {
      popupContent += '<br><a target="_blank" href="' + this.site + '">site web</a>';
    }

    this.marker = L.marker(unproject([this.coord.x, this.coord.y]), {icon: iconsList.get(this.icon)}).bindPopup(popupContent);
    this.marker.on("click", function(e) {
      var stateObj = { foo: "bar" };
      history.pushState(stateObj, loc.name, "?id=" + loc.id);
      sideBarDisplayLocation(loc);
    });
    this.marker.addTo(map);
    this.hidden = false;
  }
}

class EventLocation extends Location {
  constructor(id, owner_id, name, coord, contact, type, description, site, end_date, icon, difficulty) {
    super(id, owner_id, name, coord, contact, type, description, site, icon)
    this.end_date = end_date
    this.category = "event"
    this.difficulty = difficulty
    this.participants = []
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
      j_owner_id = json.owner,
      j_site = json.site,
      j_type = json.types,
      j_id = json._id,
      j_difficulty = json.difficulty;

      var loc = new EventLocation(j_id, j_owner_id, j_name, Point.unpackCoord(j_coord), j_contact, j_type, j_description, j_site, j_end_date, j_icon, j_difficulty);
      if (json.participants) {
        loc.participants = json.participants
      }
      return loc
  }

  createMarker() {
    var loc = this;

    var popupContent = '<h3>' + this.name + '</h3><br>';
    if (thisUser && (thisUser.admin || thisUser.id == this.owner_id)) {
      popupContent += '<a href="#" onClick="actionDelete()">Supprimer</a> - <a href="#" onClick="actionModify()">Modifier</a><br>';
    }

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

    popupContent += formatteddate + "<br>" + formatText(this.description.replace(regex_html, "")).replace(/\n/g, "<br>");

    if (this.site.length > 0) {
      popupContent += '<br><a target="_blank" href="' + this.site + '">site web</a>';
    }

    this.marker = L.marker(unproject([this.coord.x, this.coord.y]), {icon: iconsList.get(this.icon)}).bindPopup(popupContent);
    this.marker.on("click", function(e) {
      var stateObj = { foo: "bar" };
      history.pushState(stateObj, loc.name, "?id=" + loc.id);
      sideBarDisplayLocation(loc);
    });
    this.marker.addTo(map);
    this.hidden = false;
  }

  userParticipation(userId) {
    for (var participant of this.participants) {
      if (participant.user === userId) {
        return participant.status
      }
    }
    return "none"
  }

  get participantsPretty() {
    var pretty = { yes: [], maybe: [], no: [] }
    for (var participant of this.participants) {
      switch (participant.status) {
        case "yes":
          pretty.yes.push({ name: participant.name, id: participant.user, status: "yes" })
          break;
        case "maybe":
          pretty.maybe.push({ name: participant.name, id: participant.user, status: "maybe" })
          break;
        default:
          pretty.no.push({ name: participant.name, id: participant.user, status: "no" })
          break;
      }
    }
    return pretty
  }
}

var permanentLocations = [];

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
    if(thisUser.admin) {
      $('#actionDelete').show();
      $('#actionModify').show();
      $('#actionRefresh').show();
    } else if(thisUser.id === loc.owner_id) {
      $('#actionDelete').show();
      $('#actionModify').show();
      $('#actionRefresh').show();
    } else {
      $('#actionDelete').hide();
      $('#actionModify').hide();
      $('#actionRefresh').hide();
    }
  } else {
    $('#actionDelete').hide();
    $('#actionModify').hide();
    $('#actionRefresh').hide();
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

function setParticipation(participation) {
  $('#sidebar-participants-yes-button').removeClass()
  $('#sidebar-participants-maybe-button').removeClass()
  $('#sidebar-participants-no-button').removeClass()
  switch (participation) {
    case "none":
      $('#sidebar-participants-yes-button').addClass("btn btn-outline text-success action-btn")
      $('#sidebar-participants-maybe-button').addClass("btn btn-outline text-warning action-btn")
      $('#sidebar-participants-no-button').addClass("btn btn-outline text-danger action-btn")
      break
    case "yes":
      $('#sidebar-participants-yes-button').addClass("btn btn-success action-btn")
      $('#sidebar-participants-maybe-button').addClass("btn btn-outline text-warning action-btn")
      $('#sidebar-participants-no-button').addClass("btn btn-outline text-danger action-btn")
      break
    case "maybe":
      $('#sidebar-participants-yes-button').addClass("btn btn-outline text-success action-btn")
      $('#sidebar-participants-maybe-button').addClass("btn btn-warning action-btn")
      $('#sidebar-participants-no-button').addClass("btn btn-outline text-danger action-btn")
      break
    default:
      $('#sidebar-participants-yes-button').addClass("btn btn-outline text-success action-btn")
      $('#sidebar-participants-maybe-button').addClass("btn btn-outline text-warning action-btn")
      $('#sidebar-participants-no-button').addClass("btn btn-danger action-btn")
      break
  }
}

function sideBarDisplayLocation(location) {
  switch (location.category) {
    case "rumour":

      $('#sidebar #sidebar-title-box').removeClass('list-group-item-info list-group-item-danger').addClass('list-group-item-success');
      $('#sidebar #sidebar-title').text(location.title);
      $('#sidebar #sidebar-participants').hide();
      $('.contact').text(location.contact);

      $('.site').text(location.site).attr('href', location.site).removeClass("list-group-item-info list-group-item-danger").addClass("list-group-item-success");

      // Cut description if too long.
      $('.description').html(formatText(location.text.replace(regex_html, "")));

      break;
    case "event":

      $('#sidebar #sidebar-title-box').removeClass('list-group-item-info list-group-item-success').addClass('list-group-item-danger');
      $('#sidebar #sidebar-title').text(location.name);
      var participation = location.participantsPretty;
      $('#sidebar-participants-yes').text(participation.yes.length);
      $('#sidebar-participants-maybe').text(participation.maybe.length);
      $('#sidebar-participants-no').text(participation.no.length);
      if (thisUser && thisUser.signedIn) {
        let userParticipation = location.userParticipation(thisUser.id)
        setParticipation(userParticipation)
      } else {
        setParticipation("none")
      }
      $('#sidebar #sidebar-participants').show();
      $('.contact').text(location.contact);

      $('#hours-heading').text("Date");
      var date = new Date(location.end_date);
      if (date) {
          $('.hours').text(date.toLocaleDateString() + " " + date.toLocaleTimeString().substr(0, 5));
      } else {
        $('.hours').text("Non renseigné.");
      }

      $('.type').text(location.typesToString());

      $('.site').text(location.site).attr('href', location.site).removeClass("list-group-item-info list-group-item-success").addClass("list-group-item-danger");

      // Cut description if too long.
      $('.description').html(formatText(location.description.replace(regex_html, "")));

      break;
    case "location":

      $('#sidebar #sidebar-title-box').removeClass("list-group-item-danger list-group-item-success").addClass("list-group-item-info");
      $('#sidebar #sidebar-title').text(location.name);
      $('#sidebar #sidebar-participants').hide();
      $('.contact').text(location.contact);

      $('#hours-heading').text("Horaires");
      $('.hours').text(location.hours);

      $('.type').text(location.typesToString());

      $('.site').text(location.site).attr('href', location.site).removeClass("list-group-item-danger list-group-item-success").addClass("list-group-item-info");

      // Cut description if too long.
      if (location.description.length > 800) {
        $('.description').html(formatText(location.description.replace(regex_html, "")))
      } else {
        $('.description').html(formatText(location.description.replace(regex_html, "")))
      }

      break;
    default:
      return;
  }

  displayCommand(location);

  thisLoc = location;

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

  if (thisLoc.category === "rumour") {
    $('#permloc-detail-modal-title').text(thisLoc.title);
    $('#permloc-detail-modal-description').html(formatText(thisLoc.text.replace(regex_html, "")));
  } else if (thisLoc.category === "event" || thisLoc.category === "location") {
    $('#permloc-detail-modal-title').text(thisLoc.name);
    $('#permloc-detail-modal-description').html(formatText(thisLoc.description.replace(regex_html, "")));
  }
})

/*
  Called when the user clicked the "modify" location button. It opens the location form modal, fills it with current data, and updates the document when user validates.
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

  } else if (thisLoc.category === "rumour") {

    x = thisLoc.coord.x;
    y = thisLoc.coord.y;

    $('#rumour-form #title').val(thisLoc.title);
    $('#rumour-form #contact').val(thisLoc.contact);
    $('#rumour-form #text').val(thisLoc.text.replace(regex_html, ""));


    $('#event-form #site').val(thisLoc.site);

    $('#addLocationTabs a[href="#addRumourTabContent"]').tab('show');
    $("#addMarkerModal").modal("show");
  }
}

function actionDelete() {
  if (thisLoc.category === "location") {
    // Request API to remove permanent location...
    $.ajax({
      method: "DELETE",
      url: `${api_url}/locations/` + thisLoc.id + "?token=" + thisUser.token,
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
      url: `${api_url}/events/` + thisLoc.id + "?token=" + thisUser.token,
      dataType: 'json',
      success: function(json) {
        if (json.success) {
          map.removeLayer(thisLoc.marker);
          sidebarClose();
        }
      }
    });
  } else if (thisLoc.category === "rumour") {
    // Request API to remove rumour...
    $.ajax({
      method: "DELETE",
      url: `${api_url}/rumours/` + thisLoc.id + "?token=" + thisUser.token,
      dataType: 'json',
      success: function(json) {
        if (json.success) {
          map.removeLayer(thisLoc.marker);
          sidebarClose();
        }
      },
      fail: function(json) {
      }
    });
  }
}

function actionRefresh() {
  var id = thisLoc.id
  $.ajax({
    method: "POST",
    url: `${api_url}/${thisLoc.category}s/${id}/refresh`,
    data: { token: thisUser.token },
    success: function(json) {
      console.log(json)
    }
  })
}

$("#sidebar-participants-yes-button").click(function() {
  actionParticipate(thisLoc.id, "yes")
})
$("#sidebar-participants-maybe-button").click(function() {
  actionParticipate(thisLoc.id, "maybe")
})
$("#sidebar-participants-no-button").click(function() {
  actionParticipate(thisLoc.id, "no")
})

function actionParticipate(eventId, participation) {
  if (thisUser && thisUser.signedIn) {
    $.ajax({
      method: "POST",
      url: `${api_url}/events/${eventId}/participate`,
      data: { token: thisUser.token, status: participation },
      dataType: "json",
      success: function(json) {
        console.log(json)
        if (json.success) {
          if (locationsById.has(json.event._id)) {
            locationsById.get(json.event._id).participants = json.event.participants

            if (thisLoc.id === json.event._id) {
              // Update sidebar participants
              var participationPretty = thisLoc.participantsPretty;
              $('#sidebar #sidebar-participants-yes').text(participationPretty.yes.length);
              $('#sidebar #sidebar-participants-maybe').text(participationPretty.maybe.length);
              $('#sidebar #sidebar-participants-no').text(participationPretty.no.length);
              setParticipation(participation)
            }
          }
        }
      }
    })
  } else {
    showLoginModal()
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
      url: `${api_url}/locations`,
      data: { name: name, description: description, contact: contact, types: type, coord: coord, icon: icon, category: category, hours: hours, site: site, token: thisUser.token },
      dataType: 'json',
      success: function(json) {
        if (json.success) {
          var location = json.location;
          var permanentLocation = PermanentLocation.parse(location);
          addMarker(permanentLocation);

          $("#addMarkerModal").modal("hide");
          sideBarDisplayLocation(location);
        }
      }
    });
  } else if (mode === "modify") {
    // Request API to add permanent location...
    $.ajax({
      method: "PUT",
      url: `${api_url}/locations/` + thisLoc.id,
      data: { name: name, description: description, contact: contact, types: type, coord: coord, icon: icon, category: category, hours: hours, site: site, token: thisUser.token },
      dataType: 'json',
      success: function(json) {
        if (json.success) {
          map.removeLayer(thisLoc.marker);

          var location = json.location;
          var permanentLocation = PermanentLocation.parse(location);
          addMarker(permanentLocation);

          $("#addMarkerModal").modal("hide");
          sideBarDisplayLocation(permanentLocation);
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
      url: `${api_url}/events`,
      data: { name: name, description: description, contact: contact, types: type, coord: coord, icon: icon, category: category, end_date: end_date, site: site, difficulty: difficulty, token: thisUser.token },
      dataType: 'json',
      success: function(json) {
        if (json.success) {
          var event = json.event;
          var eventLocation = EventLocation.parse(event);
          addMarker(eventLocation);

          $("#addMarkerModal").modal("hide");
          sideBarDisplayLocation(eventLocation);
        }
      },
      fail: function(json) {
      }
    });
  } else if (mode === "modify") {
    // Request API to add permanent location...
    $.ajax({
      method: "PUT",
      url: `${api_url}/events/` + thisLoc.id,
      data: { name: name, description: description, contact: contact, types: type, coord: coord, icon: icon, category: category, end_date: end_date, site: site, difficulty: difficulty, token: thisUser.token },
      dataType: 'json',
      success: function(json) {
        if (json.success) {
          map.removeLayer(thisLoc.marker);

          var event = json.event;
          var eventLocation = EventLocation.parse(event);
          addMarker(eventLocation);

          $("#addMarkerModal").modal("hide");
          sideBarDisplayLocation(eventLocation);
        }
      },
      fail: function(json) {
      }
    });
  }


  return false;
});

$("#rumour-form-submit").click(function() {

  var title = $('#rumour-form #title').val(),
    contact = $('#rumour-form #contact').val(),
    text = $('#rumour-form #text').val().replace(regex_html, ""),
    coord = "[" + x + "," + y + "]",
    site = $('#rumour-form #site').val(),
    category = "rumour";

  if (mode === "add") {
    // Request API to add rumour...
    $.ajax({
      method: "POST",
      url: `${api_url}/rumours`,
      data: { name: title, text: text, contact: contact, coord: coord, category: category, site: site, token: thisUser.token },
      dataType: 'json',
      success: function(json) {
        if (json.success) {
          var rumour = json.rumour;
          var rumourLocation = Rumour.parse(rumour);
          addMarker(rumourLocation);

          $("#addMarkerModal").modal("hide");
          sideBarDisplayLocation(rumourLocation);
        }
      },
      fail: function(json) {
      }
    });
  } else if (mode === "modify") {
    // Request API to add permanent location...
    $.ajax({
      method: "PUT",
      url: `${api_url}/rumours/` + thisLoc.id,
      data: { name: title, text: text, contact: contact, coord: coord, category: category, site: site, token: thisUser.token },
      dataType: 'json',
      success: function(json) {
        if (json.success) {
          map.removeLayer(thisLoc.marker);

          var rumour = json.rumour;
          var rumourLocation = Rumour.parse(rumour);
          addMarker(rumourLocation);

          $("#addMarkerModal").modal("hide");
          sideBarDisplayLocation(rumourLocation);
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

    makeLegend();
}
var legend;
function makeLegend() {
  legend = L.control();
  legend.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'map-legend');
    this.update();
    return this._div;
  };

  legend.update = function () {
    var html = "";
    html += '<a href="#" onclick="legendClickHideAll()">Tout cacher</a><br/>';
    html += '<a href="#" onclick="legendClickShowAll()">Tout montrer</a>';
    html += '<h4 id="legend-cat-event" onclick="legendClickHideCategory(\'event\')">Evènements</h4>';
    html += '<ul class="list-group" id="event">';
    for (var type of eventTypes) {
      html += '<button id="legend-' + type + '" class="list-group-item list-group-item-action active" type="button" onclick="legendClick(\'event\', \'' + type + '\')" >' + "<img src='/src/img/24px-map-legend-visibility.png' class='showed' />" + translate_types.get(type) + '</button>';
    }
    html += "</ul>";

    html += '<h4 id="legend-cat-location" onclick="legendClickHideCategory(\'location\')">Lieux</h4>';
    html += '<ul class="list-group" id="location">';
    for (var type of locationTypes) {
      html += '<button id="legend-' + type + '" class="list-group-item list-group-item-action active" type="button" onclick="legendClick(\'location\', \'' + type + '\')" >' + "<img src='/src/img/24px-map-legend-visibility.png' class='hidden' />" + translate_types.get(type) + '</button>';
    }
    html += "</ul>";

    html += '<h4 id="legend-cat-rumour" onclick="legendClickHideCategory(\'rumour\')">Rumeurs</h4>';
    html += '<ul class="list-group" id="rumour">';
    html += '<button id="legend-' + "rumour" + '" class="list-group-item list-group-item-action active" type="button" onclick="legendClick(\'rumour\', \'rumour\')" >' + "<img src='/src/img/24px-map-legend-visibility.png' class='hidden' />" + "Rumeur" + '</button>';
    html += "</ul>";
    this._div.innerHTML = html;
  }

  legend.addTo(map);

  // Disable dragging when user's cursor enters the element
  legend.getContainer().addEventListener('mouseover', function () {
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if (map.tap) {
      map.tap.disable();
    }
    map.off('contextmenu', onMapRightClick);
  });

  // Re-enable dragging when user's cursor leaves the element
  legend.getContainer().addEventListener('mouseout', function () {
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    if (map.tap) {
      map.tap.enable();
    }
    map.on('contextmenu', onMapRightClick);
  });
}

var activeLabels = {event : {}, location : {}, rumour : {}};
for (var type of eventTypes) {
  activeLabels["event"][type] = true;
}
for (var type of locationTypes) {
  activeLabels["location"][type] = true;
}
activeLabels["rumour"]["rumour"] = true;
function legendClick(category, type) {
  if (activeLabels[category][type]) {
    hideMarkersOfType(category, type);
  } else {
    showMarkersOfType(category, type);
  }
}

function legendClickHideCategory(category) {
  switch (category) {
    case "event":
      for (var type of eventTypes) {
        hideMarkersOfType("event", type);
      }
      $('.map-legend #legend-cat-event').attr('onclick', "legendClickShowCategory('event')");
      break;
    case "location":
      for (var type of locationTypes) {
        hideMarkersOfType("location", type);
      }
      $('.map-legend #legend-cat-location').attr('onclick', "legendClickShowCategory('location')");
      break;
    case "rumour":
      hideMarkersOfType("rumour", "rumour");
      $('.map-legend #legend-cat-rumour').attr('onclick', "legendClickShowCategory('rumour')");
      break;
    default:
      break;
  }
}

function legendClickShowCategory(category) {
  switch (category) {
    case "event":
      for (var type of eventTypes) {
        showMarkersOfType("event", type);
      }
      $('.map-legend #legend-cat-event').attr('onclick', "legendClickHideCategory('event')");
      break;
    case "location":
      for (var type of locationTypes) {
        showMarkersOfType("location", type);
      }
      $('.map-legend #legend-cat-location').attr('onclick', "legendClickHideCategory('location')");
      break;
    case "rumour":
      showMarkersOfType("rumour", "rumour");
      $('.map-legend #legend-cat-rumour').attr('onclick', "legendClickHideCategory('rumour')");
      break;
    default:
      break;
  }
}

function legendClickHideAll() {
  legendClickHideCategory("event");
  legendClickHideCategory("location");
  legendClickHideCategory("rumour");
}

function legendClickShowAll() {
  legendClickShowCategory("event");
  legendClickShowCategory("location");
  legendClickShowCategory("rumour")
}

function hideMarkersOfType(category, type) {
  $('.map-legend #' + category + ' #legend-' + type).removeClass('active');
  activeLabels[category][type] = false;
  for (var location of locationsById.values()) {
    if (!location.hidden && location.category === category) {
      var hide = true;
      for (var type of location.type) {
        if (activeLabels[category][type]) {
          hide = false;
        }
      }
      if (hide) {
        map.removeLayer(location.marker);
        location.hidden = true;
      }
    }
  }
}
function showMarkersOfType(category, type) {
  $('.map-legend #' + category + ' #legend-' + type).addClass('active');
  activeLabels[category][type] = true;
  for (var location of locationsById.values()) {
    if (location.hidden && location.category === category) {
      if (location.type.includes(type)) {
        addMarker(location);
      }
    }
  }
}

var locationsById = new Map();
function addMarker(loc) {
  locationsById.set(loc.id, loc);
  loc.createMarker();
}
createMap();
