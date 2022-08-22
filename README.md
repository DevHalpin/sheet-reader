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
