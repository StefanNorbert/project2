let genres = [];

/*============================== Helper functions =======================================*/
function getTimestamp(dateString){
    let result = Date.parse(dateString);
    return result;
}

/*============================== Startup functions =======================================*/

function requestGenres(){
    $.ajax(
        {
            url: 'https://api.themoviedb.org/3/genre/movie/list?api_key=48f0555674730b7ab94aaeaf44dd3692&language=en-US',
            method: 'GET'
        }
    ).done(function(data){
        genres = data.genres;
        console.log(genres);
        requestPopularMovies();
    }).fail(function(){
        console.log("Something went wrong in requestGenres");
    });
}

function requestPopularMovies(){
    let d = new Date();
    d.setMonth(d.getMonth() - 6);
    let year = d.getFullYear();
    let month = d.getMonth()+1;
    $.ajax(
        {
            url: 'https://api.themoviedb.org/3/discover/movie?vote_average.gte=6.5&vote_count.gte=2000&primary_release_date.gte='+year+'-'+
            month+'-01&page=1&include_video=false&include_adult=false&sort_by=popularity.desc&language=en-US&api_key=48f0555674730b7ab94aaeaf44dd3692',
            method: 'GET'
        }
    ).done(function(data){
        showResults(data, 1, true);
    }).fail(function(){
        console.log("Something went wrong in requestPopularMovies");
    });
}

function showResults(obj, currentPage=1, autoSearch = false){
    if(!autoSearch){
        $('#results_container h2').text('Total Results: ' + obj.total_results);
    } else {
        $('#results_container h2').text('Popular New Movies');
    }
    $('.page').remove();
    let results = obj.total_results;
    if(results > 20){
        generatePagination(results, currentPage);
    } else {
        $("#pagination").css("display", "none");
    }
    generateHTML(obj.results);
}

function generatePagination(results, currentPage){
    console.log('generatePagination: ', 'Current Page: ', currentPage);
    console.log('=====================END===========================');
    let pagination = $("#pagination");
    let firstButton = pagination.find("button:first-child");
    let lastButton = pagination.find("button:last-child");
    let totalPageNumber = Math.ceil(results/20);
    pagination.css("display", "flex");
    //show/hide left/right arrow
    if(currentPage == 1 ){
        firstButton.css('display', 'none');
        lastButton.css('display', 'block');
    } else if(currentPage == totalPageNumber ){
        firstButton.css('display', 'block');
        lastButton.css('display', 'none');
    } else {
        firstButton.css('display', 'block');
        lastButton.css('display', 'block');
    }
    let counter;
    switch (currentPage%3) {
        case 1:
            counter = currentPage;
            break;
        case 2:
            counter = currentPage - 1;
            break;
        case 0:
            counter = currentPage - 2;
            break;
    }
    //generate buttons
    for(let i=1; i<=5; i++){
        let button = '';
        if(i == 4 && totalPageNumber > counter+1){
            button = $('<button class="page">...</button>');
            button.insertBefore(lastButton);
            counter++;
            button = $('<button class="page">' + totalPageNumber + '</button>');
            button.insertBefore(lastButton);
            counter++;
            break;
        }
        if(counter > totalPageNumber){
            break;
        }
        if(counter == currentPage){
            button = $('<button class="page page_selected">'+counter+'</button>');
        } else {
            button = $('<button class="page">'+counter+'</button>');
        }
        button.insertBefore(lastButton);
        counter++;
    }
    pagination.find(".page").click(changePage);
}

function generateHTML(arr){
    $('.result').remove();
    for(let i=0; i<arr.length; i++){
        let result = $('<div class="result panel" data-id="'+ arr[i].id +'"></div>');
        let src = '';
        if(arr[i].poster_path == null){
            src = 'images/no_image.png';
        } else {
            src = 'https://image.tmdb.org/t/p/w92' + arr[i].poster_path;
        }
        result.append('<img src="'  + src + '" class="image"/>');
        result.append('<h4 class="title">' + arr[i].title + '</h4>');
        result.append('<p class="release_date"><i class="fa fa-calendar" aria-hidden="true"></i>' + arr[i].release_date + '</p>');
        let content = getGenresName(arr[i].genre_ids);
        result.append('<p class="genre_ids">' + content + '</p>');
        content = arr[i].overview;
        content = content.length > 100 ? content.slice(0,97) + '...' : content ;
        result.append('<p class="overview">' + content + '<span>Click for more</span></p>');
        result.append('<p class="original_language">' + arr[i].original_language + '</p>');
        result.append('<p class="vote_average">' + arr[i].vote_count + ' \\ ' + arr[i].vote_average + '<i class="fa fa-star" aria-hidden="true"></i></p>');
        $("#results_container").append(result);
    }
    $(".result").click(showDetails);
}

/*============================== Listener functions =======================================*/

function showAdvancedSearch(){
    $(".search").css("display", "flex");
}

function hideAdvancedSearch(){
    $(".search").css("display", "none");
    $(".search:nth-child(-n+2)").css("display", "flex");
}

function startSearch(event, pageSelected = false){
    let criterias = checkSearchCriterias(pageSelected);
    if(criterias){
        searchBy(criterias);
    } else {
        $('#results_container').find('h2').text('Please enter something to search');
    }
}

function changePage(){
    let pagination = $("#pagination");
    let firstButton = pagination.find("button:first-child");
    let lastButton = pagination.find("button:last-child");
    let currentPage = pagination.find(".page_selected");
    let prevPage = parseInt(currentPage.text(), 10) - 1;
    let nextPage = parseInt(currentPage.text(), 10) + 1;
    if($(this)[0] == firstButton[0]){
        console.log('changePage: ', 'firstButton clicked');
        //firstButton.off('click');
        startSearch(false, prevPage);
    } else if ($(this)[0] == lastButton[0]){
        console.log('changePage: ', 'lastButton clicked');
        //lastButton.off('click');
        startSearch(false, nextPage);
    } else {
        console.log('changePage: ', 'other clicked', $(this).text());
        //firstButton.off('click');
        //lastButton.off('click');
        startSearch(false, $(this).text());
    }
}

/*============================== Search functions =======================================*/

function checkSearchCriterias(pageSelected = false){
    let result = {};
    result.title = '';
    result.urlParameters = '';
    result.otherCriterias = {};
    if(pageSelected){
        result.page = pageSelected;
    }
    let criteria = checkTitle();
    if(criteria){
        result.title = criteria;
    }
    if($('#advanced_search').prop( "checked" )){
        criteria = checkDategte();
        if(criteria){
            result.urlParameters += '&primary_release_date.gte=' + criteria;
            result.otherCriterias.dategte = criteria;
        }
        criteria = checkDatelte();
        if(criteria){
            result.urlParameters += '&primary_release_date.lte=' + criteria;
            result.otherCriterias.datelte = criteria;
        }
        criteria = checkGenres();
        if(criteria){
            criteria = getGenresId(criteria);
            result.urlParameters += '&with_genres=' + criteria;
            result.otherCriterias.genres = criteria;
        }
        //TODO search by actors
    }
    console.log('checkSearchCriterias: ', result, typeof result);
    if(result.title === '' && result.urlParameters === '' && $.isEmptyObject(result.otherCriterias)){
        return false;
    } else {
        return result;
    }
}

function checkTitle(){
    let title = $('#title');
    if (title && title.val()) {
        //TODO validation
        return title.val();
    } else {
        return false;
    }
}

function checkDategte(){
    let date = $('#date_gte');
    if (date && date.val()) {
        return date.val();
    } else {
        return false;
    }
}

function checkDatelte(){
    let date = $('#date_lte');
    if (date && date.val()) {
        return date.val();
    } else {
        return false;
    }
}

function checkGenres(){
    let genres = $('#genres');
    if (genres && genres.val()) {
        return genres.val();
    } else {
        return false;
    }
}

function searchBy(obj){
    if(obj.title){
        requestByTitle(obj.title, obj.page, obj.otherCriterias)
    } else {
        requestByOtherCriterias(obj.urlParameters);
    }
}

function requestByTitle(str, page=1, otherCriterias){
    console.log('requestByTitle: ' ,'Other criterias: ', otherCriterias);
    $.ajax(
        {
            url: 'https://api.themoviedb.org/3/search/movie?api_key=48f0555674730b7ab94aaeaf44dd3692&query=' +
            encodeURIComponent(str)+'&page='+page,
            method: 'GET'
        }
    ).done(function(data){
        console.log('requestByTitle done: ', data);
        if(otherCriterias.dategte){
            let filteredData = filterResults(data, otherCriterias);
            showResults(filteredData, page);
        } else {
            showResults(data, page);
        }
    });
}

function filterResults(data, otherCriterias){
    //TODO FILTER EACH RESULT PAGE
    let resultsLength = data.results.length;
    if(otherCriterias.dategte){
        data.results = data.results.filter(function(result){
            return getTimestamp(result.release_date) >= getTimestamp(otherCriterias.dategte);
        });
    }
    if(otherCriterias.datelte){
        data.results = data.results.filter(function(result){
            return getTimestamp(result.release_date) <= getTimestamp(otherCriterias.datelte);
        });
    }
    if(otherCriterias.genres){
        let searchelements = otherCriterias.genres.split(',');
        data.results = data.results.filter(function(result){
            let arr = result.genre_ids;
            for(let i=0; i<searchelements.length; i++){
                if(!arr.includes(parseInt(searchelements[i], 10))){
                    return false;
                }
            }
            return true;
        });
    }
    data.total_results -= (resultsLength - data.results.length);
    return data;
}

function requestByOtherCriterias(urlParameters){
    let url = 'https://api.themoviedb.org/3/discover/movie?api_key=48f0555674730b7ab94aaeaf44dd3692' + urlParameters;
    $.ajax(
        {
            url: url,
            method: 'GET'
        }
    ).done(function(data){
        showResults(data);
    }).fail(function(){
        console.log("Something went wrong in requestByOtherCriterias");
    });
}

function getGenresName(ids){
    let result = '';
    $.each(ids,function(i, id){
        for(let j=0; j<genres.length; j++){
            if(genres[j].id === id){
                result += genres[j].name + ',';
                break;
            }
        }
    });
    result = result.slice(0, -1);
    return result;
}

function getGenresId(str){
    let arr = str.split(',');
    let result = arr.map(function(x){
        for(let i=0; i<genres.length; i++){
            if(x == genres[i].name){
                return genres[i].id;
            }
        }
    });
    result = result.join(',');
    return result;
}

/*============================== Detail functions =======================================*/

function showDetails(){
    $('.details_container').css('display', 'block');
    let id = $(this).attr('data-id');
    console.log('Showing details for id: ' + id);
    requestDetails(id);
}

function hideDetails(){
    $('.details_container').css('display', 'none');
}

function requestDetails(id){
    $.ajax(
        {
            url: 'https://api.themoviedb.org/3/movie/' + id + '?api_key=48f0555674730b7ab94aaeaf44dd3692',
            method: 'GET'
        }
    ).done(function(data){
        console.log(data);
        editDetails(data);
    }).fail(function(){
        console.log("Something went wrong in requestDetails");
    });
}

function editDetails(data) {
    $('.details_container').css({
        'background': 'url("https://image.tmdb.org/t/p/w1280/' + data.backdrop_path + '")',
        'background-size': 'cover',
        'background-position': 'center'
    });
    let imageSource = '';
    if(data.poster_path == null){
        //TODO BIGGER NO IMAGE
        imageSource = 'images/no_image.png';
    } else {
        imageSource = 'https://image.tmdb.org/t/p/w185' + data.poster_path;
    }
    $('.details img').attr({
        src: imageSource
    });
    $('#detais_title').text(data.title);
    $('#details_tagline').text(data.tagline);
    $('#details_release_date').text('Release date: ' + data.release_date);
    $('#details_overview').html("<strong>Overview:</strong><br/>" + data.overview);
}

/*============================== Event listeners =======================================*/

$("#advanced_search").change(
    function(){
        if (this.checked) {
            showAdvancedSearch();
        } else {
            hideAdvancedSearch();
        }
    });
$(".search_button").click(startSearch);
$(".details .fa-times").click(hideDetails);
let pagination = $("#pagination");
pagination.find("button:first-child").click(changePage);
pagination.find("button:last-child").click(changePage);


requestGenres();
