/*********database functions********/
var database = {
  //the local reminders db
  local: new PouchDB('reminders'),
  //unique identifier assigned to the user
  user_id: null,
  //creates the user_id for the current user
  initUser: async () =>{
    try{
      //check the local db for a stored user code
      var result =  await database.local.get("_local/user");
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
          var localUser = await database.local.put({"_id": "_local/user", "user_id": random});
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
  },
 //cleans and organizes the db by:
 //incrementing any reminders that have a repeat frequency
 //deleting old reminders that are no longer in use
 cleanDatabase: async() =>{
   var all = await database.getAllReminders();
   //the unix time right now
   var currentTime = moment().format("X");

   for(var i = 0; i < all.length; i++){//loop through all returned reminders

     var reminderTime = all[i].details.timeStamp;//timestamp on the reminder
     var reminderRepeat =  all[i].details.repeat;//the repeat of the reminder

     //if the reminder has already happened but has a repeat requency
     if(reminderTime <= currentTime && reminderRepeat !== "Never"){
       var id = all[i].details.reminder_id;
       //increment the timestamp, date, and weekday by the repeat frequency and update the reminder in the db
       var newTimestamp = moment.unix(reminderTime).add(1,reminderRepeat).format("X");
       var newWeekDay = moment.unix(newTimestamp).format("ddd");
       var newDate = moment.unix(newTimestamp).format("MM/DD/YYYY");
       //all reminder data is the same except for the timestamp, date, weekday, and notified
       var updated = {
         reminder_id: id,
         title: all[i].details.title,
         repeat: all[i].details.repeat,
         allDay: all[i].details.allDay,
         timeStamp: newTimestamp,
         weekDay: newWeekDay,
         date: newDate,
         time: all[i].details.time,
         notified: false
       }
       await database.updateReminder(id,updated);
     }
     //otherwise if the reminder is in the past and does not repeat
     else if(reminderTime <= currentTime && reminderRepeat == "Never"){
       //delete the reminder from the db
       await database.deleteReminder(all[i].details.reminder_id);
     }
   }
   console.log("database cleaned");
 },
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
   //the specific details of the reminder
   var reminderDetails = {
     reminder_id: (Math.floor(Math.random() * 100) * Date.now()),//generate a random id
     title: newReminder.title,
     repeat: newReminder.repeat,
     allDay: newReminder.allDay,
     timeStamp:newReminder.timeStamp,
     weekDay:newReminder.weekDay,
     date:newReminder.date,
     time:newReminder.time,
     notified: false//since this a new reminder default notified to false
   }
   //get the user id and the reminder details
   var save = {"user_id":database.user_id,"details":reminderDetails};
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

  //if the response contains an error the subscription was not saved properly
  if(!response.ok){ throw "Reminder could not be deleted from the db";}
  else{console.log("Reminder deleted from db");}
 },
 //updates the specified reminder with new data
 updateReminder: async (reminderID,newData)=>{
   //get the user id and the reminder details
   var update = {"user_id":database.user_id,"reminder_id":reminderID, "new_data": newData};
   //send new reminder to the server
   var response = await fetch("/updateReminder", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body:JSON.stringify(update)
  });

  //if the response contains an error the subscription was not saved properly
  if(!response.ok){ throw "Reminder could not be updated";}
  else{console.log("Reminder updated");}
 },
 //saves the user and the user's push subcription to the db
 saveUserSubscription: async(subscription) => {
   //get the user_id and the push subscription
   var save = {"user_id":database.user_id,"sub":subscription};
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
