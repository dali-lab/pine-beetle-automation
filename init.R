# install.packages("jsonlite", dependencies = TRUE)

# this is a helper function from https://github.com/virtualstaticvoid/heroku-buildpack-r#r-package-installation-helper
# that uses the cache to not do reinstalls
helpers.installPackages("jsonlite")
