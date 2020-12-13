# MediaGallery
HTML5 Javascript PHP media gallery for photos, youtube links, MP3 files, and PDF docs

It will dynamically build menus, breadcrumbs, and thumbnails based on the file structure and files

Photo gallery is based on https://blueimp.github.io/Gallery/

Music is straight HTML5 Audio

Video uses a text file with YouTube links

## Getting Started

    <script>
        var jjkgalleryRoot = "vendor/jkauflin/jjkgallery/";
    </script>
    <script src="vendor/jkauflin/jjkgallery/mediagallery.js?ver=1.001"></script>

    <div class="collapse navbar-collapse" id="collapsibleNavbar">
        <ul class="nav navbar-nav ml-auto">
            <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#MediaPage" data-dir="Photos"><i class="fa fa-camera"></i> Photos</a></li>
            <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#MediaPage" data-dir="Videos" ><i class="fa fa-video-camera"></i> Videos</a></li>
            <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#MediaPage" data-dir="Music" ><i class="fa fa-music"></i> Music</a></li>
        </ul>
    </div>


	<div class="container tab-pane" id="MediaPage">
        <div class="row">
			<div class="hidden-xs col-sm-5 col-md-3">
				<h4 id=MediaHeader></h4>
				<div id="MediaMenu" class="panel-group"></div>
			</div>
			<div class="col-sm-7 col-md-9">
                <div id="MediaConfig" class="pull-right"></div>
				<ol id="MediaBreadcrumbs" class="breadcrumb"></ol>
				<div id="MediaFolders"></div>
                <div id="MediaThumbnails"></div>
            </div>
		</div><!-- row -->	                
	</div><!-- end of Detail -->

