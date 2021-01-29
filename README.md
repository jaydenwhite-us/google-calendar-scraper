<ol>
<li> GO TO https://developers.google.com/calendar/quickstart/nodejs</li>
<li> CLICK THE LINK "Enable the Google Calendar API" </li>
<li> COPY CONFIGURATION AND PAST INTO "./credentials.json".<br/> After pasting, the file should resemble the following</li>
</ol>


[<br/>
   {<br/>
    "installed":<br/>
    {<br/>
      "client_id":"",<br/>
      "project_id":""",<br/>
      "auth_uri":"",<br/>
      "token_uri":"",<br/>
      "auth_provider_x509_cert_url":"",<br/>
      "client_secret":"",<br/>
      "redirect_uris":[""]<br/>
    },<br/>
  },<br/>
]

NOTE: "./credentials.json" is an array

4.) SPECIFY "custom_designation", "file_path", and query.
[
    {
        "installed":
        {
          "client_id":"",
          "project_id":""",
          "auth_uri":"",
          "token_uri":"",
          "auth_provider_x509_cert_url":"",
          "client_secret":"",
          "redirect_uris":[""]
        },
        "custom_designation": "",
        "file_path": "./workCalendar.csv",
        "query":{
          "calendarId": "primary",
          "timeMin": "2020-01-01T00:00:00+00:00",
          "timeMax": "2020-06-01T00:00:00+00:00",
          "maxResults": 500,
          "singleEvents": true,
          "orderBy": "startTime",
          "pageToken": null
        }
    },
]

5.) INSTALL NODE and RUN 'NODE .' or 'node index.js' from terminal after having navigated to the root folder.
