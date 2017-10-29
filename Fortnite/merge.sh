rm merge.sql
for f in *.sql; 
do 
echo "Adding $f"
cat $f >> merge.sql;
 done