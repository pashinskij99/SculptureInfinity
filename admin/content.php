<?php 

session_start();

$login = "admin";
$password = "12345";

if($login !== $_SESSION['login'] || $password !== $_SESSION['password']) {
   header('Location: /sculpture(pash)/admin');
} 

?>

<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta http-equiv="X-UA-Compatible" content="IE=edge">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Document</title>
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
</head>
<body>
   <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
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
            <a href="includes/logout.php">Вернуться на сайт</a>
         </div>
      </div>
   </nav>
   <main>
      <div class="container">
         <table class="table">
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
         </table> 
      </div>
   </main>

   <!-- JS Bundled Propper -->
   <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>
   <script>
      // document.getElementById('data-type').addEventListener('change', (event) => {
      //    if(event.target.value == 1) {
      //       document.getElementById('text-form').classList.remove('d-none')
      //       document.getElementById('image-form').classList.add('d-none')
      //    } else {
      //       document.getElementById('text-form').classList.add('d-none')
      //       document.getElementById('image-form').classList.remove('d-none')
      //    }
      // })
   </script>
</body>
</html>


