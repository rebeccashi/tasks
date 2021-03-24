const { App } = require('@slack/bolt');
require('dotenv').config();

const { JsonDB} = require('node-json-db');
const db = new JsonDB('task_db', true, true);

const moment = require('moment')

const sampleTask = {
  "U01LFS3BN92": {
    data:[
      {
        "task": "Standup",
        "priority": "medium",
        "date": "2021/03/09",
        "time": "22:28",
      }
    ]
  }
}

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

let id, username;

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);
    
    console.log('⚡️ Bolt app is running!');
    })();

app.event('app_home_opened', async ({ event, client, body }) => {
  try {
    // console.log(body.user)

    const blocks = [
      {
        type: "section",
        text: {
          "type": "mrkdwn",
          "text": "*Welcome to your _Tasks's Home_* :tada:"
        },
        accessory: {
          type: "image",
          image_url: "https://user-images.githubusercontent.com/27893685/112247799-4e4bb980-8c2b-11eb-9369-7106d6ed2139.png",
          // image_url: "https://user-images.githubusercontent.com/27893685/112249159-abe10580-8c2d-11eb-9734-583611185058.png",
          alt_text: "task illustration"
        }
      },
      {
        type: "actions",
        block_id: "create_block",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Create a New Event"
            },
            action_id: "create_task",
            value: "create_event_button"
          }
          
        ]
      },
      {
        type: "divider"
      },  
    ];

    //get data
    const user = event.user
    id = user;
    const rawData = db.getData(`/${user}/data`)
    
    let data = rawData.slice().reverse()
    data = data.slice(0,50)

    const textArr = data.map( obj => transformText(obj))
    
    if (textArr.length > 0) {
      blocks.push(
        {
          type: "header",
          text: {
            type: "plain_text",
            text: 'Events :calendar:'
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "\n"
          }
        }
      )
    }

    textArr.map((text, id) => {
      section = {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text
        },
      }
      blocks.push(section)
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: '\n'
        },
      })
      if (id < textArr.length -1 ) {
        blocks.push({
            type: "divider"
          },
        )
      }
    })
    // console.log(blocks)

    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.publish({

      /* the user that opened your app's app home */
      user_id: event.user,

      /* the view object that appears in the app home*/
      view: {
        type: 'home',
        callback_id: 'home_view',
        blocks: blocks,

      }
    });
  }
  catch (error) {
    console.error(error);
  }
});

const transformText = (obj) => {
  text = `*${obj.task}*\n`
      
  emoji = ""
  startTime = obj.time.startTime
  hour = startTime.slice(0,2)
  if (hour < 12) {
    startTime += "am"
  } else {
    hour = hour== 12 ? hour : hour-12 
    startTime = hour + startTime.slice(2,5)
    startTime += "pm"
  }
  startTime = startTime.length == 7 ? startTime : startTime + "  "

  endTime = obj.time.endTime
  hour = endTime.slice(0,2)
  if (hour < 12) {
    endTime += "am"
  } else {
    hour = hour== 12 ? hour : hour-12 
    endTime = hour + endTime.slice(2,5)
    endTime += "pm"
  }

  if (obj.priority == 'Urgent') {
    emoji = ":large_red_square:"
  } else if (obj.priority == 'High') {
    emoji = ":large_orange_square:"
  } else if (obj.priority == 'Medium') {
    emoji = ":large_yellow_square:"
  } else if (obj.priority == 'Low') {
    emoji = ":large_green_square:"
  }
  text += `*Priority:* ${obj.priority} ${emoji}\n *Date*: ${obj.date}\n`
  text += `*Start Time*: ${startTime} \t\t\t\t\t\t *End Time*: ${endTime}`
  return text
}

// clicking the button is not triggering this function
app.action("create_task", async ({ack, body, client}) => {
  await ack();
  const {trigger_id} = body;
  //  user: {
  //   id: 'U01LFS3BN92',
  //   username: 'xs938',
  //   name: 'xs938',
  //   team_id: 'T01L9T9TE0K'
  // },
  const user = body.user;

  const m = moment().format()
  const initialDate = m.slice(0,10)
  const initialTime = m.slice(11,16)

  try {
    await client.views.open({
      trigger_id: trigger_id,
      view: {
        type: 'modal',
        callback_id: 'create_task_view',
        title: {
          type: 'plain_text',
          text: 'Create a Task'
        },
        submit: {
          type: 'plain_text',
          text: 'Create'
        },
        blocks: [
          // Text input
          {
            "type": "input",
            "block_id": "task_name",
            "label": {
              "type": "plain_text",
              "text": "Task"
            },
            "element": {
              "action_id": "content",
              "type": "plain_text_input",
              "placeholder": {
                "type": "plain_text",
                "text": "Write down your task"
              },
              "multiline": true
            }
          },
          
          // Drop-down menu      
          {
            "type": "input",
            "block_id": "priority",
            "label": {
              "type": "plain_text",
              "text": "Priority",
            },
            "element": {
              "type": "static_select",
              "action_id": "select_priority",
              "options": [
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Urgent"
                  },
                  "value": "Urgent"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "High"
                  },
                  "value": "High"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Medium"
                  },
                  "value": "Medium"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Low"
                  },
                  "value": "Low"
                }
              ]
            }
          
          },
          {
            "type": "actions",
            "block_id": "date_pickers",
            "elements": [
              {
                "type": "datepicker",
                "initial_date": initialDate,
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select a date",
                  "emoji": true
                },
                "action_id": "select_date1"
              },
            ]
          },
          {
            "type": "actions",
            "block_id": "time_pickers",
            "elements": [
              {
                "type": "timepicker",
                "initial_time": initialTime,
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select time",
                  "emoji": true
                },
                "action_id": "select_time1"
              },
              {
                "type": "timepicker",
                "initial_time": initialTime,
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select time",
                  "emoji": true
                },
                "action_id": "select_time2"
              }
            ]
          },
        ]
      }
    })
  } 
  catch (error) {
    console.log(error.message)
  }
})

// send acks to buttons
app.action('select_date1', async ({ ack}) => {
  await ack();
})

app.action('select_date2', async ({ ack}) => {
  await ack();
})

app.action('select_time1', async ({ ack}) => {
  await ack();
})

app.action('select_time2', async ({ ack}) => {
  await ack();
})


// listens for and processes view submission
app.view('create_task_view', async ({ ack, body, client, view}) => {
  await ack();
  const values = view.state.values;
  const user = body.user;
  const id = user.id;

  const taskName = values.task_name.content.value;
  const priority = values.priority.select_priority.selected_option.value;
  const date = values.date_pickers.select_date1.selected_date;
  const startTime = values.time_pickers.select_time1.selected_time;
  const endTime = values.time_pickers.select_time2.selected_time;

  // console.log(`${id} ${taskName} ${priority} ${date} ${startTime} ${endTime}`)

  const newTask = {
    task: taskName,
    priority: priority,
    date: date,
    time: {
      startTime: startTime,
      endTime: endTime
    }
  }
  db.push(`/${id}/data[]`, newTask, true)

  //build new view
  const text = transformText(newTask)
  

})
