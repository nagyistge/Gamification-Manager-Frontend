
 // global variables
var client, gameId,memberId, notification;
var oidc_userinfo;
var iwcCallback;
function setGameIDContext(gameId_){
  gameId = gameId_;
  //$('#game-id-text').html(gameId);
  if(gameId){
    //gadgets.window.setTitle("Gamification Manager Level - " + gameId);
    $("h4#title-widget").text("Game ID : " + gameId);
    if(gameId == ""){
      $("table#list_levels").find("tbody").empty();
    }
    else{
      levelModule.init();
    }
  }
}

var initIWC = function(){
  notification = new gadgets.MiniMessage("GAMELEVEL");

  iwcCallback = function(intent) {
    console.log(intent);
    if(intent.action == "REFRESH_APPID"){

      setGameIDContext(intent.data);
      console.log(gameId);
    }
    if(intent.action == "FETCH_APPID_CALLBACK"){
      notification.dismissMessage();
      var data = JSON.parse(intent.data);
      if(data.status == 200){
        oidc_userinfo = data.member;
        loggedIn(oidc_userinfo.preferred_username);
        if(data.receiver == "level"){
          if(data.gameId){
            setGameIDContext(data.gameId);
          }
          else{
            miniMessageAlert(notification,"Game ID in Gamification Manager Game is not selected","danger")
          }
        }
      }
      else if(data.status == 401){
          $("table#list_levels").find("tbody").empty();
           var newRow = "<tr class='text-center'><td colspan='6'>You are not logged in</td>";
           $("table#list_levels").find("tbody").append(newRow);
      }

    }
    if(intent.action == "LOGIN"){
      var data = JSON.parse(intent.data);
      if(data.status == 200){
        oidc_userinfo = data.member;
        loggedIn(oidc_userinfo.preferred_username);
      }
      else if(data.status == 401){
          $("table#list_levels").find("tbody").empty();
           var newRow = "<tr class='text-center'><td colspan='6'>You are not logged in</td>";
           $("table#list_levels").find("tbody").append(newRow);
      }
    }
    // if(intent.action == "FETCH_LOGIN_CALLBACK"){
    //   var data = JSON.parse(intent.data);
    //   if(data.receiver == "level"){
    //     if(data.status == 200){
    //       oidc_userinfo = data.member;
    //         loggedIn(oidc_userinfo.preferred_username);
    //     }
    //   }
    // }
  };
  loadLas2peerWidgetLibrary();
  // $('button#refreshbutton').on('click', function() {
  //     sendIntentFetchLogin("level");
  // });
};

var loadLas2peerWidgetLibrary = function(){
  try{
    client = new Las2peerWidgetLibrary("<%= grunt.config('endPointServiceURL') %>", iwcCallback);
  }
  catch(e){
    var msg =notification.createDismissibleMessage("Error loading Las2peerWidgetLibrary. Try refresh the page !." + e);
    msg.style.backgroundColor = "red";
    msg.style.color = "white";
  }
};

var loggedIn = function(mId){
  memberId = mId;
  init();

  // client = new Las2peerWidgetLibrary("<%= grunt.config('endPointServiceURL') %>", iwcCallback);

  $("table#list_levels").find("tbody").empty();
   var newRow = "<tr class='text-center'><td colspan='6'>Hello " +memberId+ "</td>";
   $("table#list_levels").find("tbody").append(newRow);
};

var init = function() {
  $('button#refreshbutton').off('click');
  $('button#refreshbutton').on('click', function() {
      sendIntentFetchGameId("level");
  });
}


// function signinCallback(result) {
//     if(result === "success"){
//       memberId = oidc_userinfo.preferred_username;
//
//         console.log(oidc_userinfo);
//         init();
//
//     } else {
//
//
//         console.log(result);
//         console.log(window.localStorage["access_token"]);
//
//     }
// }

var useAuthentication = function(rurl){
    if(rurl.indexOf("\?") > 0){
      rurl += "&access_token=" + window.localStorage["access_token"];
    } else {
      rurl += "?access_token=" + window.localStorage["access_token"];
    }
    return rurl;
  }

function sendIntentFetchGameId(sender){
  client.sendIntent(
    "FETCH_APPID",
    sender
  );
}

// function sendIntentFetchLogin(sender){
//   client.sendIntent(
//     "FETCH_LOGIN",
//     sender
//   );
// }

$(document).ready(function() {
  initIWC();

});


var levelModule = (function() {

  var levelAccess;
  var modalInputId;
  var modalInputName;
  var modalInputPointValue;
  var modalSubmitButton;
  var modalTitle;
  var maxlevel;

  var modalNotifCheck;
  var modalNotifMessageInput;
  var levelCollection;

  var initialize = function(){

    levelAccess = new LevelDAO();
    modalSubmitButton = $("#modallevelsubmit");
    modalInputId = $("#modalleveldiv").find("#level_num");
    modalTitle = $("#modalleveldiv").find(".modal-title");
    modalInputName = $("#modalleveldiv").find("#level_name");
      modalInputPointValue = $("#modalleveldiv").find("#level_point_value");
    modalNotifCheck = $("#modalleveldiv").find("#level_notification_check");
    modalNotifMessageInput = $("#modalleveldiv").find("#level_notification_message");
  };

  function renderLevelTable(data){

    $("table#list_levels").find("tbody").empty();
    console.log(data);
     if(data.rows.length < 1){
        var newRow = "<tr class='text-center'><td colspan='6'>No data Found !</td>";
        $("table#list_levels").find("tbody").append(newRow);
     }
     else if(data.message){
       var newRow = "<tr class='text-center'><td colspan='6'>"+data.message+"</td>";
       $("table#list_levels").find("tbody").append(newRow);
     }
     else{
       for(var i = 0; i < data.rows.length; i++){
            var level = data.rows[i];

            var newRow = "<tr><td class='text-center numclass'>" + level.number + "</td>";
            newRow += "<td class='text-center nameclass'>" + level.name + "</td>";
            newRow += "<td class='pointvalueclass'>" + level.pointValue + "</td>";
            newRow += "<td class='text-center usenotifclass''>" + level.useNotification + "</td>";
            newRow += "<td class='messageclass''>" + level.notificationMessage + "</td>";
            newRow += "<td class='text-center'>" + "<button type='button' class='btn btn-xs btn-warning updclass'>Edit</button> ";

            if(i == data.rows.length-1){
              newRow += "<button type='button' class='btn btn-xs btn-danger delclass'>Delete</button>";
            }
            newRow += "</td>";

            $("table#list_levels").find("tbody").append(newRow);
          }
      }
  }

  var loadTable = function(){

    //$("table#list_levels").find("tbody").empty();
    levelAccess.getLevelsData(
      gameId,
      notification,
      function(data,type){
        $("#modalleveldiv").modal('hide');
        levelCollection = data.rows;
        renderLevelTable(data);
          $("table#list_levels").find(".updclass").off("click");
          $("table#list_levels").find(".updclass").on("click", function(event){
            if(levelCollection){

              var selectedRow =  $(event.target).parent().parent()[0];
              var selectedLevel = levelCollection[selectedRow.rowIndex-1];

              $(modalSubmitButton).html('Update');
              $(modalTitle).html('Update an Level');
              $(modalInputId).val(selectedLevel.number);
              $(modalInputId).prop('readonly', true);
              $(modalInputName).val(selectedLevel.name);
              $(modalInputPointValue).val(selectedLevel.pointValue);
              $(modalNotifCheck).prop('checked',selectedLevel.useNotification);
              $(modalNotifMessageInput).val(selectedLevel.notificationMessage);
              $(modalNotifMessageInput).prop('readonly',true);
              if(selectedLevel.useNotification){
                $(modalNotifMessageInput).prop('readonly',false);
              }

              $("#modalleveldiv").modal('toggle');
          }
        });

        $("table#list_levels").find(".delclass").off("click");
        $("table#list_levels").find(".delclass").on("click", function(event){
          var selectedRow =  $(event.target).parent().parent()[0];
          var selectedLevel = levelCollection[selectedRow.rowIndex-1];

          levelAccess.deleteLevel(
            gameId,
            notification,
            function(data,type){
              loadTable();
            },
            function(status,error){},
            selectedLevel.number
          );
          });
        },
        function(status,error) {
          console.log(error);
        }
    );
  };

  var addNewButtonListener = function(){
    $("button#addnewlevel").off('click');
    $("button#addnewlevel").on('click', function(event) {
        // count number of rows so the number can be incremented
      var levelindex = $("table#list_levels").find("tbody tr").length;
      console.log($("table#list_levels").find("tr"));
        // Adapt Modal with add form
      $(modalSubmitButton).html('Submit');
      $(modalInputId).prop('readonly', true);
      $(modalInputId).val(levelindex);
      $(modalTitle).html('Add a New Level');
      $(modalInputName).val('');
      $(modalInputPointValue).val('');
      $(modalNotifCheck).prop('checked',false);
      $(modalNotifMessageInput).val('');
      $("#modalleveldiv").modal('toggle');

    });
  };

  var checkBoxListener = function(){
      // Check boxes in modal
  // check box for point flag
    $('input[type="checkbox"]#level_notification_check').click(function(){
          if($(this).prop("checked") == true){
              $(modalNotifMessageInput).prop('readonly', false);
          }
          else if($(this).prop("checked") == false){
              $(modalNotifMessageInput).prop('readonly', true);
          }
      });
  };

  var submitFormListener = function(){
    $("form#modallevelform").off();
    $("form#modallevelform").submit(function(e){
      //disable the default form submission
      e.preventDefault();
      var formData = new FormData($(this)[0]);

      var submitButtonText = $(modalSubmitButton).html();

      var levelnum = $(modalInputId).val();

      if(submitButtonText=='Submit'){
        levelAccess.createNewLevel(
          gameId,
          formData,
          notification,
          function(data,type){
            $("#modalleveldiv").modal('toggle');
            loadTable();
          },
          function(status,error){},
          levelnum
        );
      }
      else{
        levelAccess.updateLevel(
          gameId,
          formData,
          notification,
          function(data,type){
            $("#modalleveldiv").modal('toggle');
            loadTable();
          },
          function(status,error){},
          levelnum
        );
      }

      return false;
    });
  };

  return {
    init : function(){
      initialize();
      loadTable();
      addNewButtonListener();
      checkBoxListener();
      submitFormListener();
    },
    loadTable:loadTable
  };


})();
