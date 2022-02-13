const fetch = require('node-fetch');
const { App } = require("@octokit/app");

const app = new App({
  appId: APP_ID,
  privateKey: PRIVATE_KEY,
  oauth: {
    clientId: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
  },
  webhooks: {
    secret: WEBHOOK_SECRET,
  },
});

app.log.warn('Yay, the app was loaded!');

const GOOD_FIRST_REGEX = /^good\sfirst\sissue$/i;

app.webhooks.onAny(async (context) => {
  console.log({ event: context.name, action: context.payload.action });
});

app.webhooks.on('issues.labeled', async (context) => {
  console.log(context);
  const { labels } = context.payload.issue;

  if (!GOOD_FIRST_REGEX.test(context.payload.label.name)) return;
  console.log(context.payload.issue.html_url);

  // send message to discord
  // const webhook = DISCORD_WEBHOOK_URL;
  // const params = {
  //   username: 'GFI-Catsup [beta]',
  //   avatar_url: 'https://github.com/open-sauced/assets/blob/master/logo.png?raw=true',
  //   content: `New good first issue: ${context.payload.issue.html_url}`,
  // };
  //
  // // send post request using fetch to webhook
  // fetch(webhook, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(params),
  // });
});

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  if (request.method === "GET") {

    const { data } = await app.octokit.request("GET /app");

    return new Response(
      `<h1>Cloudflare Worker Example GitHub app</h1>
<p>Installation count: ${data.installations_count}</p>

<p><a href="https://github.com/apps/${data.slug}">Install</a> | <a href="https://github.com/open-sauced/catsup-app/#readme">source code</a></p>`,
      {
        headers: { "content-type": "text/html" },
      }
    );
  }

  const id = request.headers.get("x-github-delivery");
  const name = request.headers.get("x-github-event");
  const payload = await request.json();

  console.log(id);
  console.log(name);
  console.log(payload);

  try {
    // TODO: implement signature verification
    // https://github.com/gr2m/cloudflare-worker-github-app-example/issues/1
    await app.webhooks.receive({
      id,
      name,
      payload,
    });

    return new Response(`{ "ok": true }`, {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    app.log.error(error);

    return new Response(`{ "error": "${error.message}" }`, {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
