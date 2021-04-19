FROM docker.gf.com.cn/node:12.14.0-alpine as npminstall
LABEL maintainer="hanyiding<hanyiding@gf.com.cn>"

WORKDIR /tmp
COPY package*.json ./
ARG nodejs_org_mirror=http://registry.npm.taobao.org/mirrors/node
ARG npm_config_registry=https://registry.npm.taobao.org
ENV NODEJS_ORG_MIRROR=${nodejs_org_mirror} NPM_CONFIG_REGISTRY=${npm_config_registry}
RUN npm i --production --verbose

FROM docker.gf.com.cn/oracle-nodejs:12.16 
WORKDIR /src-app
COPY . ./
COPY --from=npminstall /tmp/node_modules /src-app/node_modules

ENTRYPOINT ["node", "app.js"]
