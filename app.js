//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");
const dotenv=require('dotenv');
dotenv.config();

const app = express();

//! for build communication with ejs file
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.URL,{useNewUrlParser:true});
// mongodb://127.0.0.1:27017/todolist

//! Created Schema
const itemsSchema = {
  name: String
};

//! Created model
const Item = mongoose.model("Item",itemsSchema);

//! Creating items
const item1 =new Item({
  name:"Welcome to your todolist!"
});

const item2 =new Item({
  name:"Hit the + button to add a new item"
});

const item3 =new Item({
  name:"<-- Hit this to delete an item"
});

//! Storing items into an array
const defaultItems = [item1, item2, item3];

//! schema for routings
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({})

  .then(foundItems => {

    if(foundItems.length === 0){
      Item.insertMany(defaultItems).then(function(){
     console.log("Successfully saved default items to DB");
     })
     .catch(function(err){
     console.log(err);
     });
     res.redirect("/");
     }
     else{
       res.render("list", {listTitle: "Today", newListItems: foundItems});
     }

  })
  .catch(err =>{
    console.error(err);

  });

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({name:customListName})
  .then((foundList) =>{
    if(!foundList){
      //! create new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
    
      list.save();
      res.redirect("/" + customListName);
    }
    else{
        //! show existing list
      res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
    }
  })
  .catch((err) =>{
    console.log(err);
  });

  
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName})
    .then(foundList=>{
      foundList.items.push(item)
      foundList.save();
      res.redirect("/" + listName);
    });

  }
  
});


app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
    .then(function(){
      console.log("Successfully deleted the checked item.");
    })
    .catch(function(err){
      console.log(err);
    });
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull: {items: {_id: checkedItemId}}})
    .then(foundList =>{
      res.redirect("/" + listName);
    });

  }

});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
