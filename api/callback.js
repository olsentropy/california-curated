// OAuth bridge for Sveltia/Decap CMS — step 2 of 2.
// GitHub redirects here after the user authorizes. We exchange the code
// for an access token, then send the token back to the CMS via the
// postMessage protocol Decap/Sveltia expects.

export default async function handler(req, res) {
	const { code, error } = req.query;

	if (error) {
		res.statusCode = 400;
		return res.end(`GitHub OAuth error: ${error}`);
	}
	if (!code) {
		res.statusCode = 400;
		return res.end('Missing OAuth code parameter.');
	}

	const clientId = process.env.GITHUB_CLIENT_ID;
	const clientSecret = process.env.GITHUB_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		res.statusCode = 500;
		return res.end(
			'Server misconfiguration: GITHUB_CLIENT_ID and/or GITHUB_CLIENT_SECRET are not set.',
		);
	}

	// Exchange the temporary code for an access token.
	let token;
	try {
		const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code,
			}),
		});
		const data = await tokenRes.json();
		if (data.error || !data.access_token) {
			res.statusCode = 500;
			return res.end(`Token exchange failed: ${data.error || 'no access_token in response'}`);
		}
		token = data.access_token;
	} catch (err) {
		res.statusCode = 500;
		return res.end(`Token exchange request failed: ${err.message || err}`);
	}

	// Build the postMessage payload the CMS expects.
	const payload = JSON.stringify({ token, provider: 'github' });
	const successMessage = `authorization:github:success:${payload}`;

	const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Auth complete</title></head>
<body style="font-family:system-ui;padding:2rem;text-align:center;color:#444;">
<p>Authentication complete. You may close this window.</p>
<script>
(function () {
	function receiveMessage(e) {
		// Send the token to the parent window once it indicates it's listening.
		window.opener.postMessage(
			${JSON.stringify(successMessage)},
			e.origin
		);
		window.removeEventListener('message', receiveMessage, false);
	}
	window.addEventListener('message', receiveMessage, false);
	// Tell the parent we're ready to send the token.
	window.opener.postMessage('authorizing:github', '*');
})();
</script>
</body></html>`;

	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.end(html);
}
