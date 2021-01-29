const fs = require('fs');
const {google} = require('googleapis');

const TOKENS_PATH = 'tokens.json';
const tokens = require("./" + TOKENS_PATH);

const credentials = require("./credentials.json");

// If modifying these scopes, delete tokens.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly'];
// The file tokens.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.


// Load client secrets from a local file.
//This is the "main" function. It importS the Credentials, authorizes with oAuth2, and runs the script listEvents on callback with the auth token as the argument.
async function main(){
    const tokens_obj = await tokens;
    const credential_array = await credentials;

    for await (const credentials of credential_array){
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const designation = credentials["custom_designation"];
        const oAuth2Client = await new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        if(tokens_obj.hasOwnProperty(designation)){
            oAuth2Client.setCredentials(tokens[designation]);
            await customListEvents(oAuth2Client, credentials).catch((err)=>{
                console.error(err);
            })
        }else {
            let token = await customGetAccessToken(oAuth2Client, credentials);
            await oAuth2Client.setCredentials(token);
            customListEvents(oAuth2Client, credentials).then((data) => {
                console.log(data);
            }).catch((err) => {
                console.error(err);
            });
            await customStoreAccessToken(token, designation);
        }
    }
}


main().catch((err)=>{
    if(err)console.error(err);
});

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
async function customGetAccessToken(oAuth2Client, credentials) {
    const { once } = require('events');
    const {client_id, redirect_uris} = credentials.installed;
    const designation = credentials.custom_designation;

    const authUrl = oAuth2Client.generateAuthUrl({
        client_id: client_id,
        redirect_uri: redirect_uris[0],
        response_type: "code",
        access_type: 'offline',
        scope: SCOPES,
    });

    const readline = require('readline');
    const { promisify } = require('util');

    readline.Interface.prototype.question[promisify.custom] = function(prompt) {
        return new Promise(resolve =>
            readline.Interface.prototype.question.call(this, prompt, resolve),
        );
    };
    readline.Interface.prototype.questionAsync = promisify(
        readline.Interface.prototype.question,
    );


    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    let answer = await rl.questionAsync('Enter the code from that page here: ');

    rl.close();
    let response = await oAuth2Client.getToken(answer);
    return response.tokens;
}

function customStoreAccessToken(token, designation){
    const tokens = require("./tokens.json");
    tokens[designation] = token;
    // Store the revised token map to disk for later program executions
    fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, "\t"), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKENS_PATH);
    });
}
/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function customListEvents(auth, credentials) {
    const fileName = credentials.file_path;
    const calendar = google.calendar({version: 'v3', auth});
    const query = credentials.query;


    //Clean File. When implementing for a database, use the "nextSync" (double check that)
    // token to only get the events that have changed between the last query and present day.

    fs.writeFile(fileName, "", (err) => {
        if (err) throw err;
    });

    let headers = "";
    let header_arry = [];
    Object.keys(TEMPLATE_GOOGLE_OBJECT).forEach((key)=>{
        headers += key + ",";
        header_arry.push(key);
    });
    headers += "\n";
    fs.appendFile(fileName, headers, (err) => {
        if (err) throw err;
    });

    do {

        let response = await calendar.events.list(query).catch((err)=>{console.log(err);});

        const events = response.data.items;

        if (events.length) {
            console.log("\nRETURNED " + events.length + " EVENTS");

            for(const event of events){
                let line = "";
                for(const key of header_arry) {
                    if(event[key] === undefined){
                        line += "NULL,";
                        continue;
                    }
                    let data = JSON.stringify(event[key]);
                    data = data.replace(/\\n/g, "");
                    if (typeof (event[key]) === "object") {
                        data = data.replace(/["]/g, "\"\"");
                        data = "\"" + data + "\"";
                    }
                    data += ",";
                    line += data;
                }

                line += "\n";
                fs.appendFile(fileName, line, (err) => {
                    if (err) throw err;
                });
            }

        }else console.log("NO DATA TO REPORT.");
        query.pageToken = response.data.nextPageToken;

    }while(query.pageToken !== undefined);

    console.log("DATA WRITTEN TO CSV: " + fileName);
}

//This Template provides constant headers to check against. A database normally will take care of this, adding a new column to the table as needed.
let TEMPLATE_GOOGLE_OBJECT = {
    "kind": "calendar#event",
    "etag": "etag",
    "id": "string",
    "status": "string",
    "htmlLink": "string",
    "created": "datetime",
    "updated": "datetime",
    "summary": "string",
    "description": "string",
    "location": "string",
    "colorId": "string",
    "creator": {
        "id": "string",
        "email": "string",
        "displayName": "string",
        "self": "boolean"
    },
    "organizer": {
        "id": "string",
        "email": "string",
        "displayName": "string",
        "self": "boolean"
    },
    "start": {
        "date": "date",
        "dateTime": "datetime",
        "timeZone": "string"
    },
    "end": {
        "date": "date",
        "dateTime": "datetime",
        "timeZone": "string"
    },
    "endTimeUnspecified": "boolean",
    "recurrence": [
        "string"
    ],
    "recurringEventId": "string",
    "originalStartTime": {
        "date": "date",
        "dateTime": "datetime",
        "timeZone": "string"
    },
    "transparency": "string",
    "visibility": "string",
    "iCalUID": "string",
    "sequence": "integer",
    "attendees": [
        {
            "id": "string",
            "email": "string",
            "displayName": "string",
            "organizer": "boolean",
            "self": "boolean",
            "resource": "boolean",
            "optional": "boolean",
            "responseStatus": "string",
            "comment": "string",
            "additionalGuests": "integer"
        }
    ],
    "attendeesOmitted": "boolean",
    "extendedProperties": {
        "private": {
        "key": "string"
        },
        "shared": {
            "key": "string"
        }
    },
    "hangoutLink": "string",
        "conferenceData": {
        "createRequest": {
            "requestId": "string",
                "conferenceSolutionKey": {
                "type": "string"
            },
            "status": {
                "statusCode": "string"
            }
        },
        "entryPoints": [
            {
                "entryPointType": "string",
                "uri": "string",
                "label": "string",
                "pin": "string",
                "accessCode": "string",
                "meetingCode": "string",
                "passcode": "string",
                "password": "string"
            }
        ],
            "conferenceSolution": {
            "key": {
                "type": "string"
            },
            "name": "string",
                "iconUri": "string"
        },
        "conferenceId": "string",
            "signature": "string",
            "notes": "string",
            "gadget": {
            "type": "string",
                "title": "string",
                "link": "string",
                "iconLink": "string",
                "width": "integer",
                "height": "integer",
                "display": "string",
                "preferences": {
                "key": "string"
            }
        },
        "anyoneCanAddSelf": "boolean",
            "guestsCanInviteOthers": "boolean",
            "guestsCanModify": "boolean",
            "guestsCanSeeOtherGuests": "boolean",
            "privateCopy": "boolean",
            "locked": "boolean",
            "reminders": {
            "useDefault": "boolean",
                "overrides": [
                {
                    "method": "string",
                    "minutes": "integer"
                }
            ]
        },
        "source": {
            "url": "string",
                "title": "string"
        },
        "attachments": [
            {
                "fileUrl": "string",
                "title": "string",
                "mimeType": "string",
                "iconLink": "string",
                "fileId": "string"
            }
        ]
    }
};