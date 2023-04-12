# slightly modified version of https://github.com/joshkatz/r-script/blob/master/R/launch.R
# does not use needs.R now; it directly imports jsonlite
# also reads from stdin instead of from env

library(jsonlite)

run <- function(dataIn) {

  # set up environment
  input <- unname(dataIn[[1]])
  .e <- as.environment(list(
    path = dataIn[[2]],
    out = modifyList(list(x = NULL, auto_unbox = T),
      dataIn[[3]], keep.null = T)
  ))
  lockBinding(".e", environment())

  # run source, capture output
  captured <- tryCatch(capture.output({
    temp <- source(.e$path, local = T)$value
  }), error = function(err) err)
  unlockBinding(".e", environment())

  # process and return
  if (inherits(captured, "error")) {
    msg <- conditionMessage(captured)
    cat("Error in R script", .e$path, "\n", sQuote(msg), file = stderr())
    return(invisible(F))
  }
  .e$out$x <- if (is.null(temp)) {
     ""
  } else {
    temp
  }
  do.call(toJSON, .e$out)
}

f <- file("stdin", "r")
lines <- readLines(con = f, n=1)
suppressWarnings(
  run(fromJSON(lines))
)
close(f)
