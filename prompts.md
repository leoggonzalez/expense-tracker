**First prompt**

I keep my income and expenses in a table like this in the csv provided. I want to create an app to help me follow up my expenses, given the following parameters:
tech stack:

- written in latest nextjs
- with prisma as an orm
- with postgress as a database
- use typescript and scss
  key features
- i can add an income or an expense
- i can add a begin date and an optional end date
- all entries belong to groups and have a description as well
- I have a dashboard to quickly see the current month expenses and incomes
- I have a detailed view where i can see a table of proyected expenses, the table looks like this:
- it has one column per month, starting with the current month and then i will be able to select how many months i want to display (this is done by a date field where i can select month and year in the future)
- the rows are grouped by entries.group
- there is a breakpoint after each group with a partial total
- at the end there is the total of income and expenses per month
  things to take into account:
- there is a folder of elements
- stack element: is basically a wrapper for flex <stack gap={10} direction="column">...`</stack>`
- box element: is a wrapper for div with max width and padding. Padding can be either a number of an object (paddingTop, paddingLeft, etc) <box padding={10} maxWidth={500}>...`</box>`
- text element: containes styles for different sizes of text, colors, and html element: `<text size="h1" color="primary" as="h1">`...`</text>`
- composed components are in the components folder
- model contains all logic and should be done in OOP
- css should be properly written following BEM guidelines, don't use any tailwind, i want only good old css well written.
- there is a main variables.scss that contains all css variables for colors
- component guidelines:
- the main html element contains a css class that should be the same name of the component. Example MainTable.tsx contains `<div className="main-table" />`
- components NEVER style other components. Example: ".main-table .stack" is forbidden

**Second Prompt**

- create a container component that uses grid and keeps the main children in the middle. The maximum width of the middle column is determined by a css variable and by default is 1000px
  - navbar should use container
  - main content should use container
- the main app container should use css grid
- in package json: add format script to format all code and another script lint to make sure everything is linted with eslint
- add new feature to edit entries
- in the add new entry form:
  - end date should be filled by default with today's date
  - add a checkbox with the label "recurring" so we can quickly clear the end date
  - create a new table groups, and the group input should behave in a way that will create a new group if the user types a name that doesn't exist yet, otherwise it should just select one of the existing groups
- new feature: add many entries at once:
  - same start and end date
  - same group
  - for each entry, select if its expense, the description and the amount
- in the entries page, display only the recent 10 entries, and a see all entries link
- create a new all entries page with pagination and filters by date, group and description
- finally, create a zip with only the changed files
