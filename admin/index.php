<?php 
session_start();

$login = "admin";
$password = "12345";


   if($_SESSION['login'] === $login && $_SESSION['password'] === $password) {
      header('Location: /sculpture(pash)/admin/content.php');
   } else {
      echo "Bad";
   }
?>

<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta http-equiv="X-UA-Compatible" content="IE=edge">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Admin Dashboard</title>
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
</head>
<style>
   main {
      display: flex;
      height: 100vh;
      justify-content: center;
      align-items: center;
   }
</style>
<body>
   <!-- <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
         <a href="#" class="navbar-brand">
            <img src="https://getbootstrap.com/docs/5.0/assets/brand/logo.svg" alt="" width="30" height="24" class="d-inline-block align-top">
            Dashboard
         </a>
         <button class="navbar-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false">
            <span class="navbar-toggler-icon"></span>
         </button>
         <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
               <li class="nav-item">
                  <a href="nav-link active" aria-current="page" href="#">
                     Управление контентом
                  </a>
               </li>
            </ul>
            <a href="#">Вернуться на сайт</a>
         </div>
      </div>
   </nav> -->
   
   <main style="margin-top: 20px;">
      <!-- <div class="container"> -->
         <form action="includes/login.php" method="post" class="row g-3 col-md-6" style="width: 20%;">
            <h2>Вход в админ панель</h2>
            <div class="col-md-12">
               <label for="var-title" class="form-label">Логин</label>
               <input type="text" name="login" class="form-control" id="var-title">
            </div>
            <div class="col-md-12">
               <label for="var-title" class="form-label">Пароль</label>
               <input type="password" name="password" class="form-control" id="var-title">
            </div>

            <div class="col-12">
               <button type="submit" class="btn btn-primary">Войти</button>
            </div>
         </form>

         <!-- <table class="table">
            <thead class="thead-dark">
               <tr>
                  <th scope="col">#</th>
                  <th scope="col">Название</th>
                  <th scope="col">Значение</th>
                  <th scope="col"></th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <th scope="row">1</th>
                  <td>Side Title</td>
                  <td align="right">
                     <div class="btn-group">
                        <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">Действие</button>
                        <ul class="dropdown-menu">
                           <li><a class="dropdown-item" href="#">Изменить</a></li>
                           <li><a class="dropdown-item" href="#">Удалить</a></li>
                        </ul>
                     </div>
                  </td>
               </tr>
            </tbody>
         </table> -->
      <!-- </div> -->
   </main>

   <!-- JS Bundled Propper -->
   <!-- <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>
   <!-- <script>
      document.getElementById('data-type').addEventListener('change', (event) => {
         if(event.target.value == 1) {
            document.getElementById('text-form').classList.remove('d-none')
            document.getElementById('image-form').classList.add('d-none')
         } else {
            document.getElementById('text-form').classList.add('d-none')
            document.getElementById('image-form').classList.remove('d-none')
         }
      })
   </script> --> 
</body>
</html>