require("dotenv").config();
const { google } = require("googleapis");
const {
  findAndReturnTheRightSheetName,
  processSheetData,
  displayShifts,
  buildEventBody,
} = require("./helpers");

const arg = process.argv.slice(2);
const user = arg[0]
const range = arg[1]
const timeZoneDelta = arg[2]

if (!user) {
  return console.log("Error: No name code provided")
}

let sheetsAPI;
let calendarAPI;

const getSpreadSheetData = async () => {
  try {
    const response = await sheetsAPI.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      fields: "namedRanges",
    });
    const namedRanges = response.data.namedRanges;
    sheetName = findAndReturnTheRightSheetName(namedRanges,range);

    if (!sheetName) {
      console.log("Error: No sheet data found for this date range!");
      return;
    }
    const result = await sheetsAPI.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: sheetName,
      majorDimension: "ROWS",
    });
    const shifts = await processSheetData(result.data.values,user, timeZoneDelta);
    displayShifts(shifts);
    return shifts;
  } catch (err) {
    console.log("err", err);
  }
};

const sendCalendarInvite = async (shifts) => {
  const eventSummary = 'Lighthouse Labs Tutoring';
  shifts.forEach(shift => {
    shift.shifts.forEach(async sh => {
      const event = buildEventBody(sh, eventSummary);
      const existingCalendarEvents = await listCalendarEvents();
      const conflictingMeeting = existingCalendarEvents
          .find(conflict => new Date(conflict.start.dateTime).getTime() === event.start.dateTime.getTime() && conflict.summary === eventSummary);
      if (!conflictingMeeting) {
        await createCalendarEvent(event);
      }
    })
  })
};

const createCalendarEvent = async (event) => {
  const eventCreatedResult = await calendarAPI.events.insert({
    calendarId: process.env.CALENDAR_ID,
    resource: event,
  });
  console.log(eventCreatedResult.data);
}

const listCalendarEvents = async () => {
  const events = await calendarAPI.events.list({
      calendarId: process.env.CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: "startTime",
  });
  return events.data.items;
};

const authenticate = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.PATH_TO_KEYFILE,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  });

  const authClient = await auth.getClient();

  sheetsAPI = google.sheets({
    version: "v4",
    auth: authClient,
  });

  calendarAPI = google.calendar({
    version: "v3",
    auth: authClient,
  })
};

if (process.env.NODE_ENV === "dev") {
  authenticate()
    .then(_ => getSpreadSheetData())
    .then(shifts => sendCalendarInvite(shifts))
}
