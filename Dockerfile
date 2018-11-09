FROM node:10-slim

LABEL "com.github.actions.name"="Create an issue"
LABEL "com.github.actions.description"="Creates a new issue using a template with front matter."
LABEL "com.github.actions.icon"="gear"
LABEL "com.github.actions.color"="red"

LABEL "repository"="http://github.com/JasonEtco/create-an-issue"
LABEL "homepage"="http://github.com/JasonEtco/create-an-issue"
LABEL "maintainer"="Jason Etcovitch <jasonetco@github.com>"

ADD package.json /package.json
ADD package-lock.json /package-lock.json

RUN npm ci

WORKDIR /
COPY . /

ENTRYPOINT ["/entrypoint.sh"]