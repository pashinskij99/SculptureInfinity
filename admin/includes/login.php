<?php

$login = "admin";
$password = "12345";

if($login === $_POST['login'] && $password === $_POST['password']) {
   
   session_start();

   $_SESSION['login'] = $_POST['login'];
   $_SESSION['password'] = $_POST['password'];

   header('Location: /sculpture(pash)/admin/content.php');
} 
