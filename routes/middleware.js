
// Define the isAuthenticated middleware
const isAuthenticated = (req, res, next) => {
    // Check if the user is authenticated
    if (req.session && req.session.user_email) {
      // User is authenticated, proceed to the next middleware
      return next();
    }
  
    // User is not authenticated, redirect to the login page
    res.redirect('/login');
  };
module.exports = isAuthenticated