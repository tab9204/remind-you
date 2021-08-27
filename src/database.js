import "../libraries/pouchdb-7.2.1.js";

/*********database functionality********/
//local DB using pouch
//used to store the user's ID
var pouchDB = {
  //create a local db
  local: new PouchDB('reminders'),
  //creates a user ID and adds it to the local db or gets an ID if one exists
  initUser: async () =>{
    try{
      //check the local db for a stored user code
      var result =  await pouchDB.local.get("_local/user");
      //assigned the returned id to the user_id variable
      database.user_id = result.user_id;
      console.log("user ID already exists: " + database.user_id);
    }
    catch (error){
      //if there is a 404 error returned then there is no user id so create one
      if(error.status = 404){
        //generate a random semi unique number to use as the id
        var random = (Math.floor(Math.random() * 100) * Date.now());
        try{
          //add the new user id to the local db
          var localUser = await pouchDB.local.put({"_id": "_local/user", "user_id": random});
          database.user_id = random;
          console.log("user ID created: " + random);
        }
        catch (error){
          console.log(error);
        }
      }
      else{
        //if the error is not a 404 then log the error
        console.log(error);
      }
    }
  }
}

var database = {
  //unique identifier assigned to the user
  user_id: null,
 //gets all reminders for the user from the db
 getAllReminders: async () =>{
   //request reminders from the server
   var response = await fetch("/getAllReminders", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body:JSON.stringify({"user_id":database.user_id})
  });
  //if the response contains an error there was an issue getting the reminders
  if(!response.ok){throw "Could not get reminders from the db";}

  var data = await response.json();

  console.log(data);

  return data;
 },
 //saves the specified reminder to the db
 saveReminder: async(newReminder) =>{
   //get the user id and the reminder details
   var save = {"user_id":database.user_id,"details":newReminder};
   //send new reminder to the server
   var response = await fetch("/saveReminder", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body:JSON.stringify(save)
  });

  //if the response contains an error the subscription was not saved properly
  if(!response.ok){ throw "Reminder could not be added to the db";}
  else{console.log("Reminder added to db");}


 },
 //deletes the specified reminder from the db
 deleteReminder: async (reminderID)=>{
   //get the user id and the reminder details
   var remove = {"user_id":database.user_id,"reminder_id":reminderID};
   //send new reminder to the server
   var response = await fetch("/deleteReminder", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body:JSON.stringify(remove)
  });

  //if the response contains an error the subscription was not removed properly
  if(!response.ok){ throw "Reminder could not be deleted from the db";}
  else{console.log("Reminder deleted from db");}
 },
 //saves the user and the user's push subcription to the db
 saveUserSubscription: async(subscription,user_id) => {
     //get the user_id and the push subscription
     var save = {"user_id":user_id,"sub":subscription};
     //send new user data to the server
     var response = await fetch("/saveUserSub", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body:JSON.stringify(save)
    });
    //if the response contains an error the subscription was not saved properly
    if(!response.ok){throw "Could not save user push subscription";}

  }
}

export{pouchDB,database};
