const fs = require('fs');
const express = require('express');
const serveStatic = require('serve-static');
const path = require('path');
const low = require('lowdb');
const generateName = require('./lib/nameGenerator');
const uuid = require('uuid');
const db = low('data/db.json');

db.defaults({ users: [] }).value();
db.defaults({ messages: [] }).value();

const users = db.get('users');
const messages = db.get('messages');

function getMessages(messages, users) {
  return messages
    .value()
    .map(m => {
      m.user = users.find({ id: m.userId }).value();
      return m
    });
}

function changeUserState(users, id, state) {
  users
    .find({ id })
    .assign({ isOnline: state})
    .value()
}

function getOnlineUsers(users)  {
  return users
    .value()
    .filter(u => u.isOnline);
}

module.exports.run = function (worker) {
  console.log('   >> Worker PID:', process.pid);
  const app = require('express')();

  const httpServer = worker.httpServer;
  const scServer = worker.scServer;
  httpServer.on('request', app);

  scServer.on('connection', function (socket) {
    console.log('connection')
    var userId
    socket.on('registerUser', function (data, res) {
      const user = users
        .push({
          name: generateName(),
          isOnline: true,
          id: uuid.v1()
        })
        .last()
        .value();

      res(null, {
        user,
        messages: getMessages(messages, users)
      });
      console.log('user registered')
      userId = userId
    });

    socket.on('ping', function(id, res) {
      changeUserState(users, id, true)
      userId = id
    });

    socket.on('sendMessage', function(data, res) {
      const message = messages
        .push({
          message: data.message,
          userId: data.userId
        })
        .last()
        .value();
      res(null, message);
      console.log('message saved')
    });

    socket.on('sendName', function(data, res) {

      const user = users
        .find({ id: data.userId })
        .assign({ name: data.name})
        .value();
      res(null, user);
      console.log('name saved')
    });


    var interval = setInterval(function () {
      socket.emit('data', {
        messages: getMessages(messages, users),
        users: getOnlineUsers(users)
      });
    }, 500);

    socket.on('disconnect', function () {
      clearInterval(interval);
      changeUserState(users, userId, false)
    });
  });
};
