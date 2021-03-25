const { JsonDB} = require('node-json-db');
const db = new JsonDB('test_db', true, true);

const moment = require('moment')

const id = "U01LFS3BN92"

const test1 = {
    task: "Test1",
    priority: "high",
    date: "2021/03/10",
    time: {
      startTime: "19:00",
      endTime: "20:00"
    }
}

const test2 = {
    task: "Test2",
    priority: "medium",
    date: "2021/03/10",
    time: {
      startTime: "19:00",
      endTime: "20:00"
    }
}

// db.push(`/${id}/data[]`, test2, true)

// const time = new Date(Date.now())
// console.log(time)
// console.log(time.toString())
// console.log(Date.now())

const time = moment.utc().format()
console.log(time.slice(0,10))