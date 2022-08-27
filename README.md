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
Program takes three arguments: 
1) The initials of the person who you want to look up the schedule for. 
2) An index of how many weeks ahead (or behind with negative numbers) you want to look.  Default is this week if no argument provided.  
3) How many hours ahead of PST timezone (or behinnd with negative numbers) you want to adjust for.  Default is 0 if no argument provided

For example ```node index.js DAH 1 3``` would give me my schedule for next week in EST time zone if it is up.
