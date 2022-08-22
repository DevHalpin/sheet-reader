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

### Running the program
Program takes two arguments 1) The initials of the person who you want to look up the schedule for and 2) An index of how many weeks ahead (or behind with negative numbers) you want to look.  Default is this week if you don't provide the argument.  For example ```node index.js DAH 1``` would give me my schedule for next week if it is up.
