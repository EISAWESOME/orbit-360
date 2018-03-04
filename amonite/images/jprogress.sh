#!/bin/sh

 printf '\e[35m'
echo "JPGRESS"
echo "======="
echo "batch convert directory JPG files to progressive from baseline"
 printf '\e[m'
echo "Continue? (y/n)"
 printf '\e[32m'
read choice
 printf '\e[31m'

case "$choice" in 
y|Y ) 
 echo "Boom."
 printf '\e[m'

for i in *.jpg; do

filename=${i%.*}
jpegtran -progressive "$filename.jpg" "$filename@p.jpg"
rm $filename.jpg
mv "$filename@p.jpg" "$filename.jpg"
echo "- $filename.jpg converted to progressive -"
done

 printf '\e[31m'
echo "Done."
 printf '\e[m'

 # end case
  ;;

n|N ) 
  echo "Exiting..."
  echo ""

  # end case
  ;;

* ) echo "invalid";;
esac