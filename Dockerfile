FROM node:10-slim

LABEL "com.github.actions.name"="Create an issue"
LABEL "com.github.actions.description"="Creates a new issue using a template with front matter."
LABEL "com.github.actions.icon"="alert-circle"
LABEL "com.github.actions.color"="gray-dark"

LABEL "repository"="http://github.com/JasonEtco/create-an-issue"
LABEL "homepage"="http://github.com/JasonEtco/create-an-issue"
LABEL "maintainer"="Jason Etcovitch <jasonetco@github.com>"

ADD package.json /package.json
ADD package-lock.json /package-lock.json
WORKDIR /

RUN npm ci

COPY . /

ENTRYPOINT ["node", "/entrypoint.js"]