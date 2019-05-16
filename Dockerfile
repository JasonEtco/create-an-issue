FROM node:10-alpine

LABEL "com.github.actions.name"="Create an issue"
LABEL "com.github.actions.description"="Creates a new issue using a template with front matter."
LABEL "com.github.actions.icon"="alert-circle"
LABEL "com.github.actions.color"="gray-dark"

LABEL "repository"="https://github.com/JasonEtco/create-an-issue"
LABEL "homepage"="https://github.com/JasonEtco/create-an-issue"
LABEL "maintainer"="Jason Etcovitch <jasonetco@github.com>"

COPY package*.json ./
RUN npm ci
COPY . .

ENTRYPOINT ["node", "/index.js"]
