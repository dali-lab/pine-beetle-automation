# the below command can be used outside of heroku-buildpack-r
# I'm 98% sure that dependencies = TRUE is not necessary and just takes 15 minutes to compile to do nothing
# install.packages("jsonlite", dependencies = TRUE)

# this is a helper function from https://github.com/virtualstaticvoid/heroku-buildpack-r#r-package-installation-helper
# that uses the cache to not do reinstalls
helpers.installPackages("jsonlite")
