async function checkClerkJs() {
  try {
    const res = await fetch('https://clerk.zenstudio.my.id/npm/@clerk/clerk-js@5/dist/clerk.browser.js');
    console.log('clerk.browser.js status:', res.status, res.statusText);
    console.log('clerk.browser.js content length:', (await res.text()).length);
  } catch (err) {
    console.error('clerk.browser.js error:', err);
  }
}

checkClerkJs();
