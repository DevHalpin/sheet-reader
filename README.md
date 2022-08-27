## Spreadsheet Scraper for LHL Mentor Schedule

### How to set up:
- Create Project on Google Cloud Platform: [Link](https://console.cloud.google.com/projectcreate)
- Click top left hamburger menu, select IAM & Admin, click Service Accounts
- Click Create Service Account and fill in details
- Click the three dots under Actions and click Manage Keys
- Click Add Key then Create new key
- Select JSON and click Create, this will download your key
- Copy key into project root folder and add path to file to the PATH_TO_KEYFILE entry in .env file.
- Add spreadsheet id from scheduler spreadsheet to .env 
- Add your service account to the list of people who can manage your google calendar
  - Go to https://calendar.google.com
  - Click on the gear icon at the top right then settings
  - On the left side, under Settings for my calendars, click on the calendar you want the event to be added to
  - Under the Share with specific people, click on Add people
  - Enter the service account's email address and set the permission to select Make changes and manage sharing
- Add the Google calendar ID to .env
  - Follow this to get your Google calendar ID https://xfanatical.com/blog/how-to-find-your-google-calendar-id/

### Running the program
Program takes three arguments: 
1) The initials of the person who you want to look up the schedule for. 
2) An index of how many weeks ahead (or behind with negative numbers) you want to look.  Default is this week if no argument provided.  
3) How many hours ahead of PST timezone (or behinnd with negative numbers) you want to adjust for.  Default is 0 if no argument provided

For example ```node index.js DAH 1 3``` would give me my schedule for next week in EST time zone if it is up.
