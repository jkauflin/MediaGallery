# MediaGallery
HTML5 Javascript PHP dynamic media gallery for photos, youtube links, MP3 files, and PDF docs

It will dynamically build menus, breadcrumbs, and thumbnails based on the file structure and files

Photo gallery is based on [blueimp library](https://blueimp.github.io/Gallery/)

Music is straight HTML5 Audio

Video uses a text file with YouTube links

## Getting Started
1. Put your files in a Media folder on the web root with the following folders:
```
Media
    Docs
    images
    Music
    Photos
    Videos
``` 

2. Add the following dependencies to ``composer.json`` to pull in the package from 	[packagist.org](https://packagist.org/packages/jkauflin/jjkgallery)

```
{
    "require": {
        "jkauflin/jjkgallery": "^1.1.0"
    }
}
```

3. Add the mediagallery javascript file to the root web page:
```
    <script src="vendor/jkauflin/jjkgallery/mediagallery.js?ver=1.003"></script>
```

4. Add navigation link with data-dir and MediaPage references:
```
    <div class="collapse navbar-collapse" id="collapsibleNavbar">
        <ul class="nav navbar-nav ml-auto">
            <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#MediaPage" data-dir="Photos"><i class="fa fa-camera"></i> Photos</a></li>
            <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#MediaPage" data-dir="Videos" ><i class="fa fa-video-camera"></i> Videos</a></li>
            <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#MediaPage" data-dir="Music"><i class="fa fa-music"></i> Music</a></li>
        </ul>
    </div>
```

5. Add a MediaPage tab-pane with the following DIV sections
```
	<div class="tab-pane" id="MediaPage">
        <div class="row">
			<div class="col-sm-5 col-md-3 d-none d-sm-block">
				<h4 id=MediaHeader></h4>
				<div id="MediaMenu" class="panel-group"></div>
			</div>
			<div class="col-sm-7 col-md-9">
                <div id="MediaConfig" class="float-right m-2"></div>
				<ol id="MediaBreadcrumbs" class="breadcrumb mt-2 p-1"></ol>
				<div id="MediaFolders"></div>
                <div id="MediaThumbnails"></div>
            </div>
		</div><!-- row -->	                
	</div><!-- end of Detail -->
```
