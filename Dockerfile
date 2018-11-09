FROM node:10-slim

LABEL "com.github.actions.name"="NPM Audit"
LABEL "com.github.actions.description"="Runs an `npm audit fix` and opens a pull request to suggest the fixes."
LABEL "com.github.actions.icon"="gear"
LABEL "com.github.actions.color"="red"

LABEL "repository"="http://github.com/JasonEtco/create-an-issue"
LABEL "homepage"="http://github.com/JasonEtco/create-an-issue"
LABEL "maintainer"="Jason Etcovitch <jasonetco@github.com>"

ADD package.json /package.json
ADD package-lock.json /package-lock.json
WORKDIR /
COPY . /

RUN npm ci

ENTRYPOINT ["./entrypoint.sh"]