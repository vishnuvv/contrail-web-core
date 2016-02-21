$(document).ready(function () {
    if (getCookie('username') != null) {
        $('#user_info').text(getCookie('username'));
    }

    $('#user-profile').show();

    //Listener to expand/collapse widget based on toggleButton in widget header
    $("#content-container").find('div.widget-box div.widget-header div.widget-toolbar a[data-action="collapse"]').live('click', function () {
        $(this).find('i').toggleClass('icon-chevron-up').toggleClass('icon-chevron-down');
        var widgetBodyElem = $(this).parents('div.widget-box').find('div.widget-body');
        var widgetBoxElem = $(this).parents('div.widget-box');
        $(widgetBoxElem).toggleClass('collapsed');
    });

    // expand/collapse widget on click of widget header
    $("#content-container").find('div.widget-box div.widget-header h4').live('click', function () {
        $(this).parents('div.widget-header').find('a[data-action="collapse"] i').toggleClass('icon-chevron-up').toggleClass('icon-chevron-down');
        var widgetBodyElem = $(this).parents('div.widget-box').find('div.widget-body');
        var widgetBoxElem = $(this).parents('div.widget-box');
        $(widgetBoxElem).toggleClass('collapsed');
    });

    $('.preBlock i').live('click', function () {
        $(this).toggleClass('icon-minus').toggleClass('icon-plus');
        if ($(this).hasClass('icon-minus')) {
            $(this).parent('.preBlock').find('.collapsed').hide();
            $(this).parent('.preBlock').find('.expanded').show();
            $(this).parent('.preBlock').find('.preBlock').show();
            if ($(this).parent('.preBlock').find('.preBlock').find('.expanded').is(':visible')) {
                $(this).parent('.preBlock').find('.preBlock').find('.collapsed').hide();
                $(this).parent('.preBlock').find('.preBlock').find('i').removeClass('icon-plus').addClass('icon-minus');
            }
            else {
                $(this).parent('.preBlock').find('.preBlock').find('.collapsed').show();
                $(this).parent('.preBlock').find('.preBlock').find('i').removeClass('icon-minus').addClass('icon-plus');
            }
        }
        else if ($(this).hasClass('icon-plus')) {
            $(this).parent('.preBlock').find('.collapsed').show();
            $(this).parent('.preBlock').find('.expanded').hide();
        }
    });

    $(window).on('scroll', function () {
        scrollHeight = $(document).height() - $(window).height();
        var current_scroll = $(this).scrollTop();

        if (current_scroll < 50 || previous_scroll - current_scroll > 40) {
            $("#pageHeader").show();
            $('#sidebar').removeClass('scrolled');
            $('#breadcrumbs').removeClass('scrolled');
            $('#back-to-top').fadeOut();
        }
        else {
            $("#pageHeader").hide();
            $('#sidebar').addClass('scrolled');
            $('#breadcrumbs').addClass('scrolled');
            $('#back-to-top').fadeIn();
        }
        if (current_scroll < scrollHeight) {
            previous_scroll = $(window).scrollTop();
        }
    });

    $('#back-to-top').click(function (event) {
        event.preventDefault();
        $('html, body').animate({scrollTop: 0}, 500);
        return false;
    });

    //Handle if any ajax response fails because of session expiry and redirect to login page
    $(document).ajaxComplete(function (event, xhr, settings) {
        var urlHash = window.location.hash;
        var redirectHeader = xhr.getResponseHeader('X-Redirect-Url');
        if (redirectHeader != null) {
            //Carry the current hash parameters to redirect URL(login page) such that user will be taken to the same page once he logs in
            if (redirectHeader.indexOf('#') == -1)
                window.location.href = redirectHeader + urlHash;
            else
                window.location.href = redirectHeader;
        }
    });

    // layoutHandler.load();

    jQuery.support.cors = true;

    //Get the CSRF token from cookie
    // globalObj['_csrf'] = getCookie('_csrf');
    // delete_cookie('_csrf');
    $.ajaxSetup({
        cache: false,
        crossDomain: true,
        //set the default timeout as 30 seconds
        timeout: 30000,
        beforeSend: function (xhr, settings) {
            if (globalObj['webServerInfo'] != null && globalObj['webServerInfo']['loggedInOrchestrationMode'] != null)
                xhr.setRequestHeader("x-orchestrationmode", globalObj['webServerInfo']['loggedInOrchestrationMode']);
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.setRequestHeader("X-CSRF-Token", getCookie('_csrf'));
        },
        error: function (xhr, e) {
            //ajaxDefErrorHandler(xhr);
        }
    });

    //$(window).resize(onWindowResize);
    lastHash = $.bbq.getState();

    $(window).hashchange(function () {
        currHash = $.bbq.getState();
        //Don't trigger hashChange if URL hash is updated from code
        //As the corresponding view has already been loaded from the place where hash is updated
        //Ideally,whenever to load a view,just update the hash let it trigger the handler,instead calling it manually
        if (globalObj.hashUpdated == 1) {
            globalObj.hashUpdated = 0;
            lastHash = currHash;
            return;
        }
        logMessage('hashChange', JSON.stringify(lastHash), ' -> ', currHash);
        logMessage('hashChange', JSON.stringify(currHash));
        layoutHandler.onHashChange(lastHash, currHash);
        lastHash = currHash;
    });
    enableSearchAhead();
    addBrowserDetection(jQuery);
    generalInit();

    //bootstrap v 2.3.1 prevents this event which firefox's middle mouse button "new tab link" action, so we off it!
    $(document).off('click.dropdown-menu');
});

// $.fn.modal.Constructor.prototype.enforceFocus = function () {
// };
