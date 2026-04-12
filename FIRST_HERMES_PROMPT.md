The application process of our educational program is right now quite long and requires numerous different tools, making the entire process very heavy on manual work for the HR team and the applicants themselves.
We want to centralize all operations in a single platform.
For now, applicants go to this website to apply:
`https://efestos.international/`
And the repository is here:
`C:\Users\olire\Documents\workspace_python\hephaestus-international`
We want to centralize where applicants go to know the next steps of the application process they're in and to give the HR team accounts to manage the applications. The final goal is to completely abandon Hubspot, Google Sheets with applicants statuses and get away from Email threads.
We will automatically add the details of applicants that reach the "agreement signed" status to Chronos and their information will update the Team Members database.
All the people in the Chronos database should have an account in the `https://www.flolabs.international/me` page. Their credentials are going to be the same.
The information in the `https://www.flolabs.international/profile` will allow them to update their information but not to remove it.
First, the entire applcation process is the same as for the emails in `C:\Users\olire\Documents\workspace_python\Emails_automation` (this is what will replace that project).
The goal is to have an interface follwing the same aesthetic as the already existing website. To the general website, the a "log in" will be added to the navigation bar at the veri right. When the user is already logged in, it should display "profile" with the profile picture instead.
On the internships pages, instead of the current HubSpot form, we will display a similar form that will pick up the role the person is applyng for automatically and will create a FLoLabs Innovations profile and will open the applcation process page. The content of the `https://www.flolabs.international/me/application` page will be updated from the backend with the content that the applicant should go through at their stage.
On the database, the stage of their application should be stored too and what used to be an email, should be a new arrangement of the page.
All the content should appear on the right. On the left, there has to be a chat that between John Hzlewood, Oliver Belliard and Paula Ferry (the name of the admin account). The page should be split into two and should allow an applicant to ask questions on the left with answers that will change depending on their application process. You can use the exact same API Keys as for the emails automation and every credential of the Emails automation.
Right now, we manage the content of the Internships page from Railway, we want to be able to tweak the content of each step from GitHub directly instead since we're only sharing URLs, it can be managed from a single STEPS.json file.
Deploy a first Preview version of this site on Vercel. When it works as intended we will deploy it as the production website.
Enrich the users database shared with Chronos with the collected details upon application. Update Chronos too to keep it working.
This is what we collect from the Hubspot form:
```
First Name* [] 
Last Name* [] 

Email* [] 
Phone Number* [France +33] [] 

By entering your number, you agree to receive transactional messages from Flo Labs R&D at the phone number provided. Message frequency varies. Message and data rates may apply. Carriers are not liable for any delays or undelivered messages. Reply STOP to opt-out. View our Privacy Policy.


Country/Region* [] 
State/Region [] 
City* [] 
LinkedIn URL* [] 

Job title*
Which position would you like to apply for? If you're interested in multiple positions, list them separated by commas. Do NOT submit multiple applications, only one per applicant.
(what will be automatic now)
Education*
[] 
CV*
No file chosen [] Source* 

Please Select
(how the person heard about the internship)
If someone referred you, please write their name below. Otherwise, leave this blank.
[] 
We'll email next steps from hr@flolabsinnovations.com. Please whitelist us now so you don't miss interview scheduling.


[] I added hr@flolabsinnovations.com to my contacts / safe senders*

By clicking 'Submit,' you consent to and agree to receive further communications from FloLabs, including emails, calls, and text messages, regarding updates, opportunities, reminders and other relevant information.

```
For the location we would prefer to display a map to select from, at no extra cost.
For now, make it so that users who are admins on Chronos, can see the applicants, their status, the stage of the application process, the date they joined, and the last time they visited the website.
Again, in FUNNEL.md, in `C:\Users\olire\Documents\workspace_python\Emails_automation` there's the list of stages. Add the new required ones.
On the left side chat, paula will be the same AI that previously answered emails but this time it will answer questions.
Admins with the hr binary role will be able to see the conversations from their flolabs.innovations profile when clicking on a lead and the list of leads with a search bar will be on the left side with a filter button allowing to open a list of filters

---

## Implementation Progress Note

This prompt has been partially implemented in the repo.

### Implemented
- Internal application flow scaffold in the website repo
- Applicant dashboard (`/me/application`)
- HR dashboard (`/me/hr`)
- Profile page (`/profile`)
- Git-managed stage content (`frontend/app/STEPS.json`)
- Applicant backend routes for creation, chat, profile updates, and HR stage/status updates
- Free map picker using OpenStreetMap / Leaflet
- Chronos-side applicant API and admin UI (`/api/applicants`, `/applicants`)
- Chronos sync contract started from the website side

### Not fully complete yet
- Real production database/auth for website-side applicant data
- Real CV upload/storage
- Verified live end-to-end Chronos sync in deployed environment
- Full parity with all `FUNNEL.md` branches/states
- Paula connected to the exact Emails_automation production stack
